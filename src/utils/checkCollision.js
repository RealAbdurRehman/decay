export default function checkCollision(box1, box2) {
  const collisionX = box1.right <= box2.left && box1.left >= box2.right;
  const collisionY = box1.top >= box2.bottom && box1.bottom <= box2.top;
  const collisionZ = box1.back >= box2.front && box1.front <= box2.back;
  return { x: collisionX, y: collisionY, z: collisionZ };
}