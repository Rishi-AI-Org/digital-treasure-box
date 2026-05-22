import { LoginForm } from "../../components/LoginForm";

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-panel">
        <p className="eyebrow">DTB21</p>
        <h1>Creator login</h1>
        <LoginForm />
      </section>
    </main>
  );
}
