import * as THREE from "three";

export interface DayNightCycleConfig {
  /**
   * Total length of a full day/night cycle in seconds (default: 600 = 10 minutes)
   */
  dayLength?: number;

  /**
   * Ratio of daytime to full cycle (default: 2/3)
   */
  dayRatio?: number;

  /**
   * Ratio of nighttime to full cycle (default: 1/3)
   */
  nightRatio?: number;

  /**
   * Starting time (0-1, where 0 is sunrise, 0.5 is sunset)
   */
  startTime?: number;
}

export class DayNightCycle {
  private scene: THREE.Scene;
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;

  // Visual objects
  private sun: THREE.Mesh;
  private moon: THREE.Mesh;

  // Configuration
  private dayLength: number; // in seconds
  private dayRatio: number;
  private nightRatio: number;

  // Time tracking
  private currentTime: number; // 0-1, where 0 is sunrise, 0.5 is sunset

  // Colors
  private readonly DAY_SKY_COLOR = new THREE.Color(0x87ceeb); // Light blue
  private readonly NIGHT_SKY_COLOR = new THREE.Color(0x0a0a1a); // Dark blue/black
  private readonly SUNRISE_SKY_COLOR = new THREE.Color(0xff6b35); // Orange
  private readonly SUNSET_SKY_COLOR = new THREE.Color(0xff6b35); // Orange

  private readonly SUN_LIGHT_COLOR = new THREE.Color(0xffd580); // Yellowish orange
  private readonly MOON_LIGHT_COLOR = new THREE.Color(0xb8d4ff); // Light bluish white
  private readonly TRANSITION_LIGHT_COLOR = new THREE.Color(0xff8844); // Sunset orange

  constructor(
    scene: THREE.Scene,
    sunLight: THREE.DirectionalLight,
    ambientLight: THREE.AmbientLight,
    hemiLight: THREE.HemisphereLight,
    config: DayNightCycleConfig = {}
  ) {
    this.scene = scene;
    this.sunLight = sunLight;
    this.ambientLight = ambientLight;
    this.hemiLight = hemiLight;

    // Apply configuration with defaults
    this.dayLength = config.dayLength ?? 600; // 10 minutes default
    this.dayRatio = config.dayRatio ?? 2 / 3;
    this.nightRatio = config.nightRatio ?? 1 / 3;
    this.currentTime = config.startTime ?? 0.25; // Start at mid-morning

    // Validate ratios
    if (Math.abs(this.dayRatio + this.nightRatio - 1) > 0.001) {
      console.warn(
        "Day and night ratios should sum to 1. Normalizing..."
      );
      const total = this.dayRatio + this.nightRatio;
      this.dayRatio /= total;
      this.nightRatio /= total;
    }

    // Create sun
    this.sun = this.createCelestialBody(
      40, // Large size
      this.SUN_LIGHT_COLOR,
      true // Emissive
    );

    // Create moon
    this.moon = this.createCelestialBody(
      35, // Slightly smaller
      new THREE.Color(0xddddff),
      true // Emissive
    );

    this.scene.add(this.sun);
    this.scene.add(this.moon);

    // Initial update
    this.updateCycle(0);
  }

  private createCelestialBody(
    size: number,
    color: THREE.Color,
    emissive: boolean
  ): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      emissive: emissive ? color : new THREE.Color(0x000000),
      emissiveIntensity: emissive ? 1 : 0,
    });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Update the day/night cycle
   * @param deltaTime Time elapsed in seconds since last frame
   */
  public update(deltaTime: number): void {
    // Advance time
    const timeIncrement = deltaTime / this.dayLength;
    this.currentTime = (this.currentTime + timeIncrement) % 1;

    this.updateCycle(deltaTime);
  }

  private updateCycle(deltaTime: number): void {
    // Calculate sun/moon positions and other properties
    const sunAngle = this.currentTime * Math.PI * 2 - Math.PI / 2;
    const moonAngle = sunAngle + Math.PI; // Moon is opposite to sun

    // Position celestial bodies
    const distance = 500;
    const height = 200;

    // Sun position (moves in an arc)
    this.sun.position.set(
      Math.cos(sunAngle) * distance,
      Math.sin(sunAngle) * distance + height,
      0
    );

    // Moon position (opposite to sun)
    this.moon.position.set(
      Math.cos(moonAngle) * distance,
      Math.sin(moonAngle) * distance + height,
      0
    );

    // Update sun light position to follow the sun
    this.sunLight.position.copy(this.sun.position);

    // Determine current phase
    const phase = this.getCurrentPhase();

    // Update sky and lighting based on phase
    this.updateSkyAndLighting(phase);

    // Update celestial body visibility
    this.sun.visible = phase !== "night";
    this.moon.visible = phase !== "day";
  }

  private getCurrentPhase():
    | "day"
    | "night"
    | "sunrise"
    | "sunset" {
    const dayStart = 0; // Sunrise at time 0
    const dayEnd = this.dayRatio; // Sunset at day ratio
    const transitionDuration = 0.05; // 5% of cycle for transitions

    if (this.currentTime < transitionDuration) {
      return "sunrise";
    } else if (
      this.currentTime >= transitionDuration &&
      this.currentTime < dayEnd - transitionDuration
    ) {
      return "day";
    } else if (
      this.currentTime >= dayEnd - transitionDuration &&
      this.currentTime < dayEnd + transitionDuration
    ) {
      return "sunset";
    } else {
      return "night";
    }
  }

  private updateSkyAndLighting(
    phase: "day" | "night" | "sunrise" | "sunset"
  ): void {
    let skyColor: THREE.Color;
    let lightColor: THREE.Color;
    let lightIntensity: number;
    let ambientIntensity: number;
    let hemiIntensity: number;

    switch (phase) {
      case "day":
        skyColor = this.DAY_SKY_COLOR;
        lightColor = this.SUN_LIGHT_COLOR;
        lightIntensity = 1.2;
        ambientIntensity = 0.6;
        hemiIntensity = 0.6;
        break;

      case "night":
        skyColor = this.NIGHT_SKY_COLOR;
        lightColor = this.MOON_LIGHT_COLOR;
        lightIntensity = 0.3;
        ambientIntensity = 0.2;
        hemiIntensity = 0.2;
        break;

      case "sunrise":
        {
          // Blend from night to day
          const progress = this.getTransitionProgress("sunrise");
          skyColor = new THREE.Color().lerpColors(
            this.NIGHT_SKY_COLOR,
            this.SUNRISE_SKY_COLOR,
            Math.sin(progress * Math.PI)
          );
          if (progress > 0.5) {
            skyColor.lerp(
              this.DAY_SKY_COLOR,
              (progress - 0.5) * 2
            );
          }
          lightColor = new THREE.Color().lerpColors(
            this.MOON_LIGHT_COLOR,
            this.SUN_LIGHT_COLOR,
            progress
          );
          lightIntensity = 0.3 + progress * 0.9;
          ambientIntensity = 0.2 + progress * 0.4;
          hemiIntensity = 0.2 + progress * 0.4;
        }
        break;

      case "sunset":
        {
          // Blend from day to night
          const progress = this.getTransitionProgress("sunset");
          skyColor = new THREE.Color().lerpColors(
            this.DAY_SKY_COLOR,
            this.SUNSET_SKY_COLOR,
            Math.sin(progress * Math.PI)
          );
          if (progress > 0.5) {
            skyColor.lerp(
              this.NIGHT_SKY_COLOR,
              (progress - 0.5) * 2
            );
          }
          lightColor = new THREE.Color().lerpColors(
            this.SUN_LIGHT_COLOR,
            this.MOON_LIGHT_COLOR,
            progress
          );
          lightIntensity = 1.2 - progress * 0.9;
          ambientIntensity = 0.6 - progress * 0.4;
          hemiIntensity = 0.6 - progress * 0.4;
        }
        break;
    }

    // Apply colors and intensities
    this.scene.background = skyColor;
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color = skyColor;
    }
    this.sunLight.color = lightColor;
    this.sunLight.intensity = lightIntensity;
    this.ambientLight.intensity = ambientIntensity;
    this.hemiLight.intensity = hemiIntensity;
    this.hemiLight.color = skyColor;
  }

  private getTransitionProgress(
    transition: "sunrise" | "sunset"
  ): number {
    const transitionDuration = 0.05; // 5% of cycle

    if (transition === "sunrise") {
      // Progress from 0 to 1 during sunrise
      return this.currentTime / transitionDuration;
    } else {
      // Progress from 0 to 1 during sunset
      const sunsetStart = this.dayRatio - transitionDuration;
      return (this.currentTime - sunsetStart) / (transitionDuration * 2);
    }
  }

  /**
   * Get the current time of day (0-1)
   */
  public getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Get the current phase of the day
   */
  public getPhase(): "day" | "night" | "sunrise" | "sunset" {
    return this.getCurrentPhase();
  }

  /**
   * Get a formatted time string (e.g., "12:00" for noon)
   */
  public getTimeString(): string {
    const hours = Math.floor(this.currentTime * 24);
    const minutes = Math.floor((this.currentTime * 24 - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }

  /**
   * Set the time of day manually (0-1)
   */
  public setTime(time: number): void {
    this.currentTime = time % 1;
    this.updateCycle(0);
  }

  /**
   * Set the day length in seconds
   */
  public setDayLength(seconds: number): void {
    this.dayLength = Math.max(60, seconds); // Minimum 1 minute
  }

  /**
   * Get configuration
   */
  public getConfig(): Required<DayNightCycleConfig> {
    return {
      dayLength: this.dayLength,
      dayRatio: this.dayRatio,
      nightRatio: this.nightRatio,
      startTime: this.currentTime,
    };
  }
}
