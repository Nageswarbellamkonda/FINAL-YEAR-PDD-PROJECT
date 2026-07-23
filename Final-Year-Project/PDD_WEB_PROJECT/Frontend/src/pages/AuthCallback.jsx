import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

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
        let result = await supabase.auth.getSession();
        if ((!result?.data?.session || !result.data.session.user) && typeof supabase.auth.getSessionFromUrl === 'function') {
          result = await supabase.auth.getSessionFromUrl();
        }

        const { data, error } = result;
        if (error) {
          console.error("Auth callback session error:", error);
        }

        const user = data?.session?.user ?? null;
        if (user?.id) {
          const { data: existingProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (!profileError && !existingProfile) {
            const metadata = getUserMetadata(user);
            const pending = getPendingProfile();
            
            // Check metadata for profile data
            const hasMetadataProfile = metadata.full_name || metadata.fullName || metadata.name;
            const profileSource = hasMetadataProfile
              ? {
                  full_name: metadata.full_name || metadata.fullName || metadata.name,
                  phone: metadata.phone,
                  role: metadata.role || 'citizen',
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
                await supabase.from('user_profiles').upsert(buildProfileRow(user, profileSource), { onConflict: 'id' });
                try {
                  sessionStorage.removeItem('pending_profile');
                } catch (err) {
                  // ignore
                }
              } catch (upsertErr) {
                console.error('Profile creation failed during email verification:', upsertErr);
              }
            } else {
              console.warn('No profile data found for user during email verification. User:', user.id);
            }
          }
        }

        await supabase.auth.signOut();

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
