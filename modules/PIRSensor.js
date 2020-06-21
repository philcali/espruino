/**
 * Helper class for reactive, PIR motion detection. The component
 * includes the ability to configure and adjust sensitiviy.
 *
 * Supported events:
 * - ready: emit when PIR sensor is calibrated
 * - change: emit whether or not the PIR sensor detects active motion
 *
 * Example:
```
let detector = new PIRSenor({
  pin: NodeMCU.D0, // Or input pin
  calibrationTimeout: 30000, // Time to calibrate
  sensistivity: 9000, // Time to stablize motion
 });
detector.on('ready', () => console.log("Calibration complete"));
detector.on('change', change => {
  console.log(change); // { value: true, timeInState: 10000, time: 20000 }
});
```
 */
class PIRSensor {
  constructor(options) {
    if (!options.pin) {
      throw new Error("Need to supply a pin for the sensor");
    }
    // "Calibrating sensor"
    setTimeout(() => {
      this.emit("ready");
      this.reset(options);
    }, options.calibrationTimeout || 30000);
  }

  /**
   * Resets the motion sensor with new parameters.
   *
   * @returns void
   */
  reset(options) {
    if (this.motionInterval) {
      clearInterval(this.motionInterval);
      this.clearStablizer();
      // Force a reset to a LOW state.
      this.transitionToMotion(Date.now(), false);
    }
    this.pir = options.pin || this.pir;
    this.pir.mode("input");
    this.interval = options.interval || 50;
    this.sensitivity = options.sensitivity || 9000;
    this.motionValue = false;
    this.motionTransitionValue = false;
    this.motionTimeout = null;
    this.motionStartTime = Date.now();
    this.motionInterval = setInterval(() => {
      let motionDetected = this.pir.read();
      if (!this.motionValue && !this.motionTransitionValue && motionDetected) {
        this.motionTransitionValue = motionDetected;
        let now = Date.now();
        // Stablizing motion detected
        this.motionTimeout = setTimeout(() => {
          this.transitionToMotion(now, motionDetected);
        }, this.sensitivity);
      } else if (this.motionTransitionValue && !motionDetected) {
        // No longer in active motion, kill it.
        this.clearStablizer();
      } else if (this.motionValue && !motionDetected) {
        this.transitionToMotion(Date.now(), motionDetected);
      }
    }, this.interval);
  }

  /**
   * Wipes the timer used for stablizing motion.
   *
   * @returns void
   */
  clearStablizer() {
    if (this.motionTimeout) {
      clearTimeout(this.motionTimeout);
      delete this.motionTimeout;
      this.motionTransitionValue = false;
    }
  }

  /**
   * Private: Triggers a "change" event for motion listeners
   *
   * @returns bool
   */
  transitionToMotion(now, motionDetected) {
    // Nothing to do, don't transition.
    if (this.motionValue === motionDetected) {
      return this.motionValue;
    }
    let previousValue = this.motionValue;
    this.motionValue = motionDetected;
    delete this.motionTimeout;
    this.emit('change', {
      time: now,
      timeInState: now - this.motionStartTime,
      value: this.motionValue
    });
    this.motionStartTime = now;
    this.motionTransitionValue = false;
    return previousValue;
  }
}

// Extend the object impl for event based mixin
Object.assign(PIRSensor.prototype, Object.prototype);

exports.PIRSensor = PIRSensor;
