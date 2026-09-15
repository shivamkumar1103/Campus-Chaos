import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 p-4">
      <LoginForm onSuccess={() => navigate('/')} />
      <p className="text-sm text-muted-foreground">
        No account? <Link className="underline" to="/signup">Sign up as student</Link>
      </p>
    </div>
  );
}
