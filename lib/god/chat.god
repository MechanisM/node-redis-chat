NODE_ROOT  = "#{File.dirname(__FILE__)}/../../"

# unicorn master
God.watch do |w|
  w.name          = "node-chat"
  w.group         = 'node'
  w.interval      = 10.seconds
  w.start         = "/usr/local/bin/node #{NODE_ROOT}app.js 2>&1 >> #{NODE_ROOT}log/chat.log &"
  w.stop_timeout  = 10.seconds
  w.start_grace   = 10.seconds
  w.restart_grace = 10.seconds
  w.pid_file      = File.join(NODE_ROOT, "tmp/chat.pid")
  
  w.start_if do |start|
    start.condition(:process_running) do |c|
      c.interval = 5.seconds
      c.running  = false
    end
  end
  
  w.restart_if do |restart|
    restart.condition(:memory_usage) do |c|
      c.above = 80.megabytes
      c.times = [3, 5] # 3 out of 5 intervals
    end
  
    restart.condition(:cpu_usage) do |c|
      c.above = 30.percent
      c.times = 5
    end
  end
  
  w.lifecycle do |on|
    on.condition(:flapping) do |c|
      c.to_state = [:start, :restart]
      c.times = 5
      c.within = 5.minute
      c.transition = :unmonitored
      c.retry_in = 10.minutes
      c.retry_times = 5
      c.retry_within = 2.hours
    end
  end
end

