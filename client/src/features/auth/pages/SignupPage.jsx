import { Link, useNavigate } from 'react-router-dom';
import { SignupForm } from '../components/SignupForm';

export function SignupPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 p-4">
      <SignupForm onSuccess={() => navigate('/')} />
      <p className="text-sm text-muted-foreground">
        Have an account? <Link className="underline" to="/login">Login</Link>
      </p>
    </div>
  );
}
