import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { apiService } from "@/lib/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"request" | "verify">("request");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState(() => sessionStorage.getItem("reset_token") || "");

  const isEmail = identifier.includes("@");

  const onRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setLoading(true);
    
    try {
      const res = await apiService.auth.sendResetOtp({ identifier: identifier.trim() });

      toast.success("Reset code sent to your email and phone!");
      if (res.resetOtpToken) {
        setResetToken(res.resetOtpToken);
        sessionStorage.setItem("reset_token", res.resetOtpToken);
      }
      setView("verify");
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || String(err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);

    try {
      const res = await apiService.auth.verifyResetOtp({
        resetOtpToken: resetToken,
        otp: otp
      });

      if (!res.success) throw new Error(res.message || "Verification failed");

      toast.success("Code verified! Set your new password.");
      
      sessionStorage.setItem("reset_otp", otp);
      navigate("/reset-password");
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || String(err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold text-lg mb-8 justify-center w-full">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white overflow-hidden border">
            <img src={logo} alt="NOVA Eye Care Logo" className="h-full w-full object-contain p-0.5" />
          </span>
          NOVA Eye Care
        </Link>

        <Card className="p-8 border border-slate-200 rounded-xl bg-white shadow-sm">
          {view === "request" ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight mb-2">Forgot password?</h1>
                <p className="text-sm text-slate-500 font-medium">
                  Enter your email or phone number and we'll send you a 6-digit code via email and SMS to reset your password.
                </p>
              </div>
              <form onSubmit={onRequestCode} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-xs font-bold uppercase text-slate-500">Email or Phone Number</Label>
                  <Input
                    id="identifier" type="text" required
                    placeholder="email@example.com or 0244 000 000"
                    value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                    className="h-12 rounded-lg text-lg"
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-lg font-bold bg-primary text-white" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Code"}
                </Button>
                <Link to="/auth" className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </Link>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-primary">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">Verify Reset Code</h1>
                <p className="text-sm text-slate-500 font-medium px-4">
                  Enter the 6-digit code sent to your {isEmail ? "email" : "phone"} ({identifier}).
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-center py-2">
                  <InputOTP maxLength={6} value={otp} onChange={(v) => { setOtp(v); if(v.length===6) setTimeout(()=>onVerifyCode(), 100); }}>
                    <InputOTPGroup className="gap-2">
                      {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} className="h-12 w-10 sm:w-12 text-lg border-2 rounded-lg" />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button onClick={() => onVerifyCode()} className="w-full h-12 rounded-lg font-bold bg-primary text-white" disabled={loading || otp.length < 6}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Code"}
                </Button>

                <div className="text-center space-y-4 pt-2">
                  <p className="text-sm text-slate-500 font-medium">
                    Didn't get the code?{" "}
                    <button type="button" onClick={onRequestCode} className="text-primary font-bold hover:underline">Resend</button>
                  </p>
                  <button onClick={() => setView("request")} className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-2 w-full">
                    <ArrowLeft className="h-3 w-3" /> Change contact details
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
