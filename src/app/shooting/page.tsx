import ShootingTraining from "./ShootingTraining";

export default function Page() {
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Penalty Shooting Game</h1>
      <p>Swipe to shoot the ball into the goal. You have 5 shots</p>
      <ShootingTraining />
    </div>
  );
}
