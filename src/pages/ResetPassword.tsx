import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { apiService } from "@/lib/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  
  const resetToken = sessionStorage.getItem("reset_token");
  const otp = sessionStorage.getItem("reset_otp");

  useEffect(() => {
    if (!resetToken || !otp) {
      toast.error("Session expired. Please request a new code.");
      navigate("/forgot-password");
    }
  }, [resetToken, otp, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error("Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.auth.resetPassword({ 
        resetOtpToken: resetToken, 
        otp: otp, 
        newPassword: password 
      });

      if (!res.success) throw new Error(res.message || "Failed to reset password");

      toast.success("Password reset successfully! You can now sign in.");
      sessionStorage.removeItem("reset_token");
      sessionStorage.removeItem("reset_otp");
      navigate("/auth");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const message = error.response?.data?.message || error.message || String(err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white overflow-hidden shadow-sm border">
               <img src={logo} alt="NOVA Eye Care Logo" className="h-full w-full object-contain p-0.5" />
            </span>
            NOVA Eye Care
          </Link>
          <h1 className="mt-6 text-2xl font-bold">Set new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please choose a strong password to protect your account.
          </p>
        </div>

        <Card className="p-8 shadow-elegant border bg-white">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password" type={showPw ? "text" : "password"} required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm" type={showPw ? "text" : "password"} required
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full rounded-xl font-bold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Reset Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
