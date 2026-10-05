import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { getDashboardPath } from "@/lib/authRouting";

/**
 * Handles Supabase email-verification redirect.
 * After tokens are processed, ensure the profile exists and send user to Login.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Confirming your email…");

  useEffect(() => {
    let cancelled = false;

    const getUserMetadata = (user) => {
      if (!user) return {};
      return user.user_metadata || user.raw_user_meta_data || {};
    };

    const getPendingProfile = () => {
      try {
        const stored = sessionStorage.getItem('pending_profile');
        if (!stored) return null;
        return JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to read pending_profile from sessionStorage:', error);
        return null;
      }
    };

    const buildProfileRow = (user, profileSource) => {
      if (!profileSource.full_name) {
        throw new Error('Profile data must include full_name');
      }
      return {
        id: user.id,
        email: user.email,
        full_name: profileSource.full_name?.trim() || null,
        phone: profileSource.phone?.trim() || null,
        role: (profileSource.role || 'citizen').toLowerCase(),
        district: profileSource.district?.trim() || null,
        mandal: profileSource.mandal?.trim() || null,
        police_station: profileSource.police_station?.trim() || null,
        department: profileSource.department?.trim() || null,
        designation: profileSource.designation?.trim() || null,
        address: profileSource.address?.trim() || null,
        profile_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    };

    (async () => {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

        // Check for error in query or hash
        const errorDesc = queryParams.get('error_description') || hashParams.get('error_description') || queryParams.get('error') || hashParams.get('error');
        if (errorDesc) {
          console.error("Auth callback received error:", errorDesc);
          if (!cancelled) {
            setMessage(`Verification notice: ${errorDesc.replace(/\+/g, ' ')}`);
            setTimeout(() => {
              if (!cancelled) navigate("/login?verified=1", { replace: true });
            }, 2000);
          }
          return;
        }

        // 1. Handle PKCE code exchange if present
        const code = queryParams.get('code');
        if (code) {
          try {
            const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeErr) console.warn("Code exchange notice:", exchangeErr.message);
          } catch (e) {
            console.warn("exchangeCodeForSession caught:", e);
          }
        }

        // 2. Handle token_hash verification if present
        const tokenHash = queryParams.get('token_hash');
        const otpType = queryParams.get('type') || 'email';
        if (tokenHash) {
          try {
            const { error: otpErr } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
            if (otpErr) console.warn("verifyOtp notice:", otpErr.message);
          } catch (e) {
            console.warn("verifyOtp caught:", e);
          }
        }

        // 3. Retrieve or refresh session
        let result = await supabase.auth.getSession();
        if ((!result?.data?.session || !result.data.session.user) && typeof supabase.auth.getSessionFromUrl === 'function') {
          try {
            result = await supabase.auth.getSessionFromUrl();
          } catch (e) {
            // ignore
          }
        }

        const isRecovery = queryParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery' || otpType === 'recovery';

        if (user?.id) {
          if (isRecovery) {
            if (!cancelled) {
              setMessage("Recovery session established! Redirecting to reset password…");
              navigate("/reset-password", { replace: true });
              return;
            }
          }

          const { data: existingProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (!profileError && existingProfile) {
            userRole = existingProfile.role || userRole;
          } else if (!profileError && !existingProfile) {
            const metadata = getUserMetadata(user);
            const pending = getPendingProfile();
            
            const hasMetadataProfile = metadata.full_name || metadata.fullName || metadata.name;
            const profileSource = hasMetadataProfile
              ? {
                  full_name: metadata.full_name || metadata.fullName || metadata.name,
                  phone: metadata.phone,
                  role: metadata.requested_role || metadata.role || 'citizen',
                  district: metadata.district,
                  mandal: metadata.mandal,
                  police_station: metadata.police_station,
                  department: metadata.department,
                  designation: metadata.designation,
                  address: metadata.address,
                }
              : pending?.profileData ?? null;

            if (profileSource && profileSource.full_name) {
              try {
                const newRow = buildProfileRow(user, profileSource);
                userRole = newRow.role || userRole;
                await supabase.from('user_profiles').upsert(newRow, { onConflict: 'id' });
                try {
                  sessionStorage.removeItem('pending_profile');
                } catch (err) {
                  // ignore
                }
              } catch (upsertErr) {
                console.error('Profile creation failed during email verification:', upsertErr);
              }
            }
          }

          if (!cancelled) {
            setMessage("Email verified successfully! Redirecting…");
            // If user has active session and completed profile, go to dashboard directly
            if (existingProfile?.profile_completed || user) {
              const dest = getDashboardPath(userRole);
              navigate(dest, { replace: true });
              return;
            }
          }
        }

        if (!cancelled) {
          setMessage("Email verified. Redirecting to login…");
          navigate("/login?verified=1", { replace: true });
        }
      } catch (err) {
        console.error("Auth callback failed:", err);
        if (!cancelled) {
          navigate("/login?verified=1", { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
