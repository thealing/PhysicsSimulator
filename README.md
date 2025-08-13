This is a GUI sandbox for testing my 2D physics engine.

Hosted at: https://themolish.netlify.app

# Physics Engine Features
- Colliders
  - Convex shapes
    - Circle
    - Polygon
  - Density
  - Restitution
  - Static and dynamic friction
  - Collision filter
  - Can be a sensor without handling collisions
- Bodies
  - Types
    - Dynamic: moves and rotates
    - Static: cannot move or rotate
  - Dynamic position
  - Dynamic velocity
  - Force can be applied
  - Impulses can be applied
  - Mass automatically calculated from colliders
- Springs
  - Stiffness
  - Resting Length
- Solver
  - Broad phase
    - Sweep and prune algorithm
    - Bounding rectangle test
  - Narrow phase
    - Distance test
    - Separating axis test
  - Velocity based simulation
  - Collision resolution
  - Friction resolution
    - Coulomb's law
  - Stability achieved by the usage of correction velocities
- Code
  - Simplicity was a main priority
  - The engine is less than 1000 loc
  - The entire physics step is only 150 loc
