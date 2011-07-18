# ex: set softtabstop=2 shiftwidth=2 expandtab:
require 'json'
require 'fileutils'

module Rubyfix
  class MastiffeTest
    @@keynumber = nil

    def initialize
    end

    # Create a random number and return it to the FitNesse JavaScript.
    # (Also save it for later.)
    def mastiffe_tag()
      @@keynumber = rand(1000000000)
      return @@keynumber
    end

    def do_table(table)
      # Watch for the file specified by the random number.
      filename = "FitNesseRoot/MastiffeResults/ResNo#{@@keynumber}/content.txt"
      sleepcount = 0;
      until(sleepcount > 3600 || File.exist?(filename))
        Kernel.sleep 1 
        sleepcount += 1
      end

      # Load the JSON.
      if File.exist?(filename) then
        begin
          res = JSON.load(File.open(filename))
        rescue JSONError=>e
          # If the load failed, maybe it wasn't written yet?
          Kernel.sleep 1
          res = JSON.load(File.open(filename))
        end

        # Blow away the temp directory.
        FileUtils.rm_rf("FitNesseRoot/MastiffeResults/ResNo#{@@keynumber}")
      else
        raise "Test timed out!"
      end

      # Return the data.
      return res
    end
  end
end


