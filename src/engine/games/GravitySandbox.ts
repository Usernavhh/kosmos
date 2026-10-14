import * as THREE from 'three';

export interface SandboxBody {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  mass: number;
  radius: number;
}

/**
 * N-tana gravitatsiya sandbox.
 * Velocity Verlet integratsiya.
 */
export class GravitySandbox {
  readonly group: THREE.Group;
  private bodies: SandboxBody[] = [];
  private G = 1.0;      // gravitatsion doimiy (sahna uchun)
  private enabled = false;
  private dtAccum = 0;
  private fixedDt = 0.02;

  constructor() {
    this.group = new THREE.Group();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  clear() {
    for (const b of this.bodies) {
      b.mesh.geometry.dispose();
      (b.mesh.material as THREE.Material).dispose();
      this.group.remove(b.mesh);
    }
    this.bodies = [];
  }

  /**
   * Yangi jism qo'shish.
   */
  addBody(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    mass: number,
    color: number,
  ): SandboxBody {
    const radius = Math.cbrt(mass) * 15;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 16),
      new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        shininess: 10,
      }),
    );
    mesh.position.copy(pos);
    this.group.add(mesh);

    const body: SandboxBody = { mesh, pos: pos.clone(), vel: vel.clone(), mass, radius };
    this.bodies.push(body);
    return body;
  }

  /**
   * Demo stsenariy — 2 yulduz + sayyora.
   */
  loadDemo() {
    this.clear();
    this.enable();

    // Markaziy yulduz (Sariq, massiv)
    this.addBody(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), 5000, 0xffcc44);

    // Ikkinchi yulduz (Ko'k)
    this.addBody(new THREE.Vector3(3000, 0, 0), new THREE.Vector3(0, 0, 0), 2500, 0x88bbff);

    // Sayyora
    this.addBody(new THREE.Vector3(0, 1500, 0), new THREE.Vector3(1.2, 0, 0.6), 200, 0xaa8866);

    // 3 ta kichik asteroid
    this.addBody(new THREE.Vector3(-1500, -800, 500), new THREE.Vector3(-0.8, 0.3, 1.0), 50, 0x888888);
    this.addBody(new THREE.Vector3(2000, 2000, -1000), new THREE.Vector3(-0.5, -0.6, -0.8), 50, 0x888888);
    this.addBody(new THREE.Vector3(-2500, 500, -2000), new THREE.Vector3(0.7, 0.4, 0.3), 50, 0x888888);
  }

  update(dt: number) {
    if (!this.enabled) return;

    this.dtAccum += dt;
    // Fixed timestep
    let steps = 0;
    while (this.dtAccum >= this.fixedDt && steps < 5) {
      this.stepPhysics(this.fixedDt);
      this.dtAccum -= this.fixedDt;
      steps++;
    }

    // Mesh pozitsiyalarini yangilash
    for (const b of this.bodies) {
      b.mesh.position.copy(b.pos);
    }
  }

  private stepPhysics(dt: number) {
    const n = this.bodies.length;
    const forces = new Array(n).fill(0).map(() => new THREE.Vector3());

    // Kuchlarni hisoblash
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = this.bodies[i];
        const b = this.bodies[j];

        const diff = new THREE.Vector3().subVectors(b.pos, a.pos);
        const distSq = diff.lengthSq() + 1e-3; // softening
        const dist = Math.sqrt(distSq);

        const forceMag = (this.G * a.mass * b.mass) / distSq;
        const forceDir = diff.clone().divideScalar(dist);

        // a ga musbat, b ga manfiy
        forces[i].addScaledVector(forceDir, forceMag / a.mass);
        forces[j].addScaledVector(forceDir, -forceMag / b.mass);
      }
    }

    // Velocity Verlet
    for (let i = 0; i < n; i++) {
      const b = this.bodies[i];
      // Yangi tezlik
      b.vel.addScaledVector(forces[i], dt);
      // Yangi pozitsiya
      b.pos.addScaledVector(b.vel, dt);

      // Yulduzlar orasidagi to'qnashuv (soddalashtirilgan)
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const other = this.bodies[j];
        const d = b.pos.distanceTo(other.pos);
        if (d < b.radius + other.radius) {
          // Birlashuv
          const totalMass = b.mass + other.mass;
          const newPos = new THREE.Vector3()
            .addScaledVector(b.pos, b.mass / totalMass)
            .addScaledVector(other.pos, other.mass / totalMass);
          const newVel = new THREE.Vector3()
            .addScaledVector(b.vel, b.mass / totalMass)
            .addScaledVector(other.vel, other.mass / totalMass);

          b.pos.copy(newPos);
          b.vel.copy(newVel);
          b.mass = totalMass;
          b.radius = Math.cbrt(totalMass) * 15;
          b.mesh.scale.setScalar(b.radius / Math.cbrt(1) / 15);

          // other ni o'chirish
          other.mesh.geometry.dispose();
          (other.mesh.material as THREE.Material).dispose();
          this.group.remove(other.mesh);
          this.bodies.splice(j, 1);
          return; // to'qnashuvdan keyin qayta boshlash
        }
      }
    }
  }

  getBodyCount(): number {
    return this.bodies.length;
  }
}