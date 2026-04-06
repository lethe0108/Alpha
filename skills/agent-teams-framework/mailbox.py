"""
Redis Mailbox - 多 Agent 消息队列系统

基于 Redis 实现的分布式消息队列，支持多进程、多 Agent 异步通信
"""
import json
import uuid
import time
import redis
from typing import Any, Dict, Optional, List
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class Message:
    """消息对象"""
    id: str
    to: str  # 目标 Agent/队列
    from_agent: str  # 发送者
    content: Any  # 消息内容
    type: str = "task"  # 消息类型：task/result/event
    priority: int = 0  # 优先级 (0-10, 越高越优先)
    created_at: str = ""  # 创建时间
    expires_at: str = ""  # 过期时间
    metadata: Dict = None  # 元数据
    
    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())
        if not self.created_at:
            self.created_at = datetime.utcnow().isoformat()
        if self.metadata is None:
            self.metadata = {}
    
    def to_dict(self) -> Dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Message":
        return cls(**data)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)
    
    @classmethod
    def from_json(cls, json_str: str) -> "Message":
        return cls.from_dict(json.loads(json_str))


class RedisMailbox:
    """
    Redis 消息队列
    
    支持:
    - 多进程/分布式
    - 消息持久化
    - 优先级队列
    - 过期时间
    - 发布/订阅
    """
    
    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        password: str = None,
        prefix: str = "mailbox"
    ):
        """
        初始化 Redis Mailbox
        
        Args:
            host: Redis 主机
            port: Redis 端口
            db: Redis 数据库
            password: 密码
            prefix: Key 前缀
        """
        self.redis = redis.Redis(
            host=host,
            port=port,
            db=db,
            password=password,
            decode_responses=True
        )
        self.prefix = prefix
        
        # 测试连接
        self.redis.ping()
    
    def _key(self, queue_name: str) -> str:
        """生成 Redis Key"""
        return f"{self.prefix}:{queue_name}"
    
    def send_message(
        self,
        to: str,
        content: Any,
        from_agent: str,
        type: str = "task",
        priority: int = 0,
        expire_seconds: int = None
    ) -> str:
        """
        发送消息
        
        Args:
            to: 目标 Agent/队列名
            content: 消息内容
            from_agent: 发送者
            type: 消息类型
            priority: 优先级 (0-10)
            expire_seconds: 过期时间 (秒)
        
        Returns:
            消息 ID
        """
        msg = Message(
            id=str(uuid.uuid4()),
            to=to,
            from_agent=from_agent,
            content=content,
            type=type,
            priority=priority
        )
        
        if expire_seconds:
            msg.expires_at = datetime.utcnow().timestamp() + expire_seconds
        
        # 使用 Sorted Set 实现优先级队列
        # score = -priority (优先级高的在前)
        score = -priority
        self.redis.zadd(self._key(to), {msg.to_json(): score})
        
        # 发布消息通知
        self.redis.publish(f"{self.prefix}:notifications", json.dumps({
            "queue": to,
            "message_id": msg.id
        }))
        
        return msg.id
    
    def receive_message(
        self,
        to: str,
        timeout: int = None,
        block: bool = True
    ) -> Optional[Message]:
        """
        接收消息
        
        Args:
            to: 队列名
            timeout: 超时时间 (秒)
            block: 是否阻塞
        
        Returns:
            Message 或 None
        """
        if block:
            # 阻塞式读取 (BZPOPMIN)
            result = self.redis.bzpopmin(self._key(to), timeout=timeout or 0)
            if result and len(result) >= 2:
                # result = (key, member, score)
                json_str = result[1]
                return Message.from_json(json_str)
            return None
        else:
            # 非阻塞读取
            result = self.redis.zpopmin(self._key(to), count=1)
            if result:
                json_str = result[0][0]
                return Message.from_json(json_str)
            return None
    
    def peek_message(self, to: str) -> Optional[Message]:
        """查看消息但不移除"""
        result = self.redis.zrange(self._key(to), 0, 0)
        if result:
            return Message.from_json(result[0])
        return None
    
    def get_queue_size(self, to: str) -> int:
        """获取队列大小"""
        return self.redis.zcard(self._key(to))
    
    def clear_queue(self, to: str):
        """清空队列"""
        self.redis.delete(self._key(to))
    
    def publish_event(self, event_type: str, data: Dict):
        """发布事件"""
        self.redis.publish(f"{self.prefix}:events:{event_type}", json.dumps(data))
    
    def subscribe_events(self, event_type: str):
        """订阅事件"""
        pubsub = self.redis.pubsub()
        pubsub.subscribe(f"{self.prefix}:events:{event_type}")
        
        for message in pubsub.listen():
            if message["type"] == "message":
                yield json.loads(message["data"])
    
    def get_stats(self) -> Dict:
        """获取统计信息"""
        keys = self.redis.keys(f"{self.prefix}:*")
        queues = [k for k in keys if "notifications" not in k and "events" not in k]
        
        stats = {
            "total_queues": len(queues),
            "queues": {}
        }
        
        for queue_key in queues:
            queue_name = queue_key.replace(f"{self.prefix}:", "")
            stats["queues"][queue_name] = {
                "size": self.redis.zcard(queue_key),
                "oldest": self.peek_message(queue_name).created_at if self.peek_message(queue_name) else None
            }
        
        return stats
    
    def cleanup_expired(self):
        """清理过期消息"""
        now = datetime.utcnow().timestamp()
        keys = self.redis.keys(f"{self.prefix}:*")
        
        for queue_key in keys:
            if "notifications" in queue_key or "events" in queue_key:
                continue
            
            # 获取所有消息
            messages = self.redis.zrange(queue_key, 0, -1, withscores=True)
            for json_str, score in messages:
                msg = Message.from_json(json_str)
                if msg.expires_at and msg.expires_at < now:
                    self.redis.zrem(queue_key, json_str)


# 全局实例
_task_mailbox = None
_result_mailbox = None


def get_task_mailbox() -> RedisMailbox:
    """获取任务邮箱"""
    global _task_mailbox
    if _task_mailbox is None:
        _task_mailbox = RedisMailbox(prefix="mailbox:tasks")
    return _task_mailbox


def get_result_mailbox() -> RedisMailbox:
    """获取结果邮箱"""
    global _result_mailbox
    if _result_mailbox is None:
        _result_mailbox = RedisMailbox(prefix="mailbox:results")
    return _result_mailbox


# 测试代码
if __name__ == "__main__":
    # 创建邮箱
    mailbox = RedisMailbox()
    
    # 发送消息
    msg_id = mailbox.send_message(
        to="backend",
        content={"feature_id": "FEAT-001", "action": "implement"},
        from_agent="commander",
        type="task",
        priority=5
    )
    print(f"发送消息：{msg_id}")
    
    # 接收消息
    msg = mailbox.receive_message("backend", timeout=5)
    if msg:
        print(f"接收消息：{msg.to_dict()}")
    
    # 查看统计
    stats = mailbox.get_stats()
    print(f"统计：{stats}")
