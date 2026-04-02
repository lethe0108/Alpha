"""
优化调度器 - 使用 Python sched 模块实现精确定时任务
"""

import sched
import time
import threading
from datetime import datetime, timezone
from typing import Callable, Any


class PrecisionScheduler:
    """
    精确调度器
    
    使用 Python sched 模块实现精确的定时任务调度
    比简单的 time.sleep 更可靠，支持多任务、优先级、取消等
    """
    
    def __init__(self):
        """初始化调度器"""
        # 使用 monotonic time，不受系统时间调整影响
        self.scheduler = sched.scheduler(time.monotonic, time.sleep)
        self._running = False
        self._thread = None
    
    def schedule_repeating(
        self,
        interval: float,
        action: Callable,
        priority: int = 1,
        immediate: bool = True
    ):
        """
        调度重复执行的任务
        
        Args:
            interval: 间隔时间 (秒)
            action: 要执行的函数
            priority: 优先级 (数字越小优先级越高)
            immediate: 是否立即执行一次
        """
        def repeating_action():
            # 执行动作
            try:
                action()
            except Exception as e:
                print(f"❌ 调度任务执行失败：{e}")
            
            # 如果还在运行，调度下一次
            if self._running:
                self.scheduler.enter(interval, priority, repeating_action)
        
        # 立即执行一次
        if immediate:
            action()
        
        # 调度第一次执行
        self.scheduler.enter(interval, priority, repeating_action)
    
    def schedule_once(
        self,
        delay: float,
        action: Callable,
        priority: int = 1
    ):
        """
        调度一次性任务
        
        Args:
            delay: 延迟时间 (秒)
            action: 要执行的函数
            priority: 优先级
        """
        self.scheduler.enter(delay, priority, action)
    
    def start(self, blocking: bool = False):
        """
        启动调度器
        
        Args:
            blocking: 是否阻塞当前线程
        """
        self._running = True
        
        if blocking:
            # 阻塞模式 - 在当前线程运行
            self.scheduler.run(blocking=True)
        else:
            # 非阻塞模式 - 在新线程运行
            self._thread = threading.Thread(
                target=self.scheduler.run,
                daemon=True,
                kwargs={'blocking': True}
            )
            self._thread.start()
    
    def stop(self):
        """停止调度器"""
        self._running = False
        self.scheduler.queue.clear()
    
    def get_next_event_time(self) -> float:
        """获取下次事件执行时间 (相对当前时间的秒数)"""
        if self.scheduler.queue:
            next_time = self.scheduler.queue[0].time
            return next_time - time.monotonic()
        return float('inf')
    
    def get_queue_size(self) -> int:
        """获取队列中的事件数量"""
        return len(self.scheduler.queue)


# 全局调度器实例
_global_scheduler = None


def get_scheduler() -> PrecisionScheduler:
    """获取全局调度器"""
    global _global_scheduler
    if _global_scheduler is None:
        _global_scheduler = PrecisionScheduler()
    return _global_scheduler


# 测试
if __name__ == "__main__":
    import datetime
    
    def test_action():
        now = datetime.datetime.now().strftime('%H:%M:%S')
        print(f"⏰ 任务执行：{now}")
    
    print("🚀 启动精确调度器测试...")
    scheduler = PrecisionScheduler()
    
    # 每 5 秒执行一次
    scheduler.schedule_repeating(interval=5, action=test_action, immediate=True)
    
    # 启动调度器
    scheduler.start(blocking=False)
    
    print(f"✅ 调度器已启动，下次执行：{scheduler.get_next_event_time():.1f}秒后")
    print(f"📊 队列大小：{scheduler.get_queue_size()}")
    
    # 运行 20 秒
    time.sleep(20)
    
    # 停止
    scheduler.stop()
    print("⏹️  调度器已停止")
