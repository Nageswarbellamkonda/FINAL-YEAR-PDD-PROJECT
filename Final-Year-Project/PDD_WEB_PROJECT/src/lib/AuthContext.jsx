import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getAuthCallbackUrl } from '@/lib/config';

const AuthContext = createContext();

// Extract readable error message from Supabase error object
function extractErrorMessage(error) {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.details) return error.details;
  if (error.error_description) return error.error_description;
  if (typeof error === 'object') {
    for (const key of ['msg', 'error', 'message', 'details', 'description']) {
      if (error[key] && typeof error[key] === 'string') {
        return error[key];
      }
    }
  }
  const str = JSON.stringify(error);
  if (str === '{}' || !str) {
    return 'An unexpected database or connection error occurred.';
  }
  return str;
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load user_profiles:', error);
    return null;
  }
  return data;
}

async function createProfileRecord(userId, profileData = {}, email = '') {
  if (!userId) {
    return { data: null, error: new Error('Missing user id') };
  }

  const row = {
    id: userId,
    email: email?.trim() || profileData.email || null,
    full_name: profileData.full_name || null,
    phone: profileData.phone || null,
    role: (profileData.role || 'citizen').toLowerCase(),
    district: profileData.district || null,
    mandal: profileData.mandal || null,
    police_station: profileData.police_station || null,
    department: profileData.department || null,
    designation: profileData.designation || null,
    address: profileData.address || null,
    profile_completed: true,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: findErr } = await supabase
    .from('user_profiles')
    .select('created_at')
    .eq('id', userId)
    .maybeSingle();

  if (findErr) {
    console.error('Failed to check existing user_profiles:', findErr);
    return { data: null, error: findErr };
  }

  if (existing) {
    const { error: updateErr } = await supabase
      .from('user_profiles')
      .update({
        email: row.email,
        full_name: row.full_name,
        phone: row.phone,
        role: row.role,
        district: row.district,
        mandal: row.mandal,
        police_station: row.police_station,
        department: row.department,
        designation: row.designation,
        address: row.address,
        profile_completed: true,
        updated_at: row.updated_at
      })
      .eq('id', userId);

    if (updateErr) {
      console.error('Failed to update existing user_profiles:', updateErr);
      return { data: null, error: updateErr };
    }
  } else {
    const { error: insertErr } = await supabase
      .from('user_profiles')
      .insert({
        ...row,
        created_at: new Date().toISOString()
      });

    if (insertErr) {
      console.error('Failed to insert user_profiles:', insertErr);
      return { data: null, error: insertErr };
    }
  }

  // Role-specific extension tables upserts
  const roleName = row.role;
  let roleError = null;

  if (roleName === 'citizen') {
    const { error } = await supabase
      .from('citizen_profiles')
      .upsert({
        user_id: userId,
        preferred_language: 'en',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    roleError = error;
  } else if (['police_officer', 'station_officer', 'dsp'].includes(roleName)) {
    const { error } = await supabase
      .from('police_profiles')
      .upsert({
        user_id: userId,
        jurisdiction_level: roleName === 'dsp' ? 'district' : 'station',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    roleError = error;
  } else if (roleName === 'lawyer') {
    const { error } = await supabase
      .from('lawyer_profiles')
      .upsert({
        user_id: userId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    roleError = error;
  } else if (roleName === 'court_officer') {
    const { error } = await supabase
      .from('court_profiles')
      .upsert({
        user_id: userId,
        court_type: row.designation || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    roleError = error;
  } else if (['administrator', 'system_admin'].includes(roleName)) {
    const { error } = await supabase
      .from('admins')
      .upsert({
        user_id: userId,
        admin_level: roleName === 'system_admin' ? 'super' : 'standard',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    roleError = error;
  } else if (['dgp', 'cyber_ops'].includes(roleName)) {
    const { error } = await supabase
      .from('police_profiles')
      .upsert({
        user_id: userId,
        jurisdiction_level: 'state',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    roleError = error;
  }

  if (roleError) {
    console.error('Failed to create role-specific profile:', roleError);
    return { data: null, error: roleError };
  }

  const { data: profileRow, error: profileErr } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr) {
    console.error('Failed to load updated user_profiles:', profileErr);
    return { data: null, error: profileErr };
  }

  return { data: profileRow || row, error: null };
}


function getUserMetadata(authUser) {
  if (!authUser) return {};
  return authUser.user_metadata || authUser.raw_user_meta_data || {};
}

function getEffectiveProfile(profileRow, authUser) {
  if (!profileRow || !authUser) return profileRow;
  
  const metadata = getUserMetadata(authUser);
  const requestedRole = metadata?.requested_role;
  const newProfile = { ...profileRow };

  // Hardcoded Seed Access for the creator's email
  if (authUser.email === 'nageswarbellamkonda56@gmail.com') {
    newProfile.role = 'system_admin';
    return newProfile;
  }

  // Fallback: If DB constraint forced 'citizen', use the requested_role from Auth metadata
  if (newProfile.role === 'citizen' && requestedRole && requestedRole !== 'citizen') {
    newProfile.role = requestedRole;
  }

  return newProfile;
}

function getPendingProfile() {
  try {
    const stored = sessionStorage.getItem('pending_profile');
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to read pending_profile from sessionStorage:', error);
    return null;
  }
}

async function createProfileFromMetadata(authUser) {
  if (!authUser?.id) {
    return { data: null, error: null };
  }

  const metadata = getUserMetadata(authUser);
  const pending = getPendingProfile();
  let profileSource = null;

  // Prioritize pending profile from sessionStorage
  if (pending?.profileData) {
    profileSource = {
      full_name: pending.profileData.full_name,
      phone: pending.profileData.phone,
      role: pending.profileData.role || 'citizen',
      district: pending.profileData.district,
      mandal: pending.profileData.mandal,
      police_station: pending.profileData.police_station,
      department: pending.profileData.department,
      designation: pending.profileData.designation,
      address: pending.profileData.address,
    };
  } else if (metadata && (metadata.full_name || metadata.fullName || metadata.name)) {
    profileSource = {
      full_name: metadata.full_name || metadata.fullName || metadata.name,
      phone: metadata.phone,
      role: metadata.requested_role || metadata.role || 'citizen',
      district: metadata.district,
      mandal: metadata.mandal,
      police_station: metadata.police_station,
      department: metadata.department,
      designation: metadata.designation,
      address: metadata.address,
    };
  }

  const existingProfile = await fetchProfile(authUser.id);
  if (existingProfile && !pending?.profileData) {
    return { data: existingProfile, error: null };
  }

  if (!profileSource || !profileSource.full_name) {
    console.warn('Unable to create profile: no profile data found in metadata or sessionStorage for user:', authUser.id);
    return { data: null, error: null };
  }

  const result = await createProfileRecord(authUser.id, profileSource, authUser.email);
  if (!result.error) {
    try {
      sessionStorage.removeItem('pending_profile');
    } catch (err) {
      // ignore
    }
  }

  return result;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const applyAuthUser = useCallback(async (authUser) => {
    if (!authUser || authUser.__isUserNotAvailableProxy === true) {
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      return;
    }

    setUser(authUser);
    setIsAuthenticated(true);
    setAuthError(null);

    let profileRow = await fetchProfile(authUser.id);
    if (!profileRow) {
      const { data: createdProfile } = await createProfileFromMetadata(authUser);
      profileRow = createdProfile || null;
    }
    
    // Apply role overrides before setting state
    setProfile(getEffectiveProfile(profileRow, authUser));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return null;
    }
    const profileRow = await fetchProfile(user.id);
    const effective = getEffectiveProfile(profileRow, user);
    setProfile(effective);
    return effective;
  }, [user]);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const { data, error } = await supabase.auth.getSession();
      const session = data?.session ?? null;

      if (error) {
        console.error('User auth check failed:', error);
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        setAuthError({
          type: 'auth_required',
          message: error.message || 'Authentication required',
        });
        return;
      }

      await applyAuthUser(session?.user ?? null);
    } catch (error) {
      console.error('User auth check failed:', error);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setAuthError({
        type: 'auth_required',
        message: error.message || 'Authentication required',
      });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [applyAuthUser]);

  const checkAppState = useCallback(async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      setAppPublicSettings(null);
      await checkUserAuth();
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred',
      });
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } finally {
      setIsLoadingPublicSettings(false);
    }
  }, [checkUserAuth]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setIsLoadingPublicSettings(true);
      setIsLoadingAuth(true);
      setAuthError(null);

      try {
        const { data, error } = await supabase.auth.getSession();
        const session = data?.session ?? null;
        if (!mounted) return;

        if (error) {
          console.error('Session init failed:', error);
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        } else {
          await applyAuthUser(session?.user ?? null);
        }
        setAppPublicSettings(null);
      } catch (error) {
        console.error('Unexpected auth init error:', error);
        if (mounted) {
          setAuthError({
            type: 'unknown',
            message: error.message || 'An unexpected error occurred',
          });
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setIsLoadingPublicSettings(false);
          setIsLoadingAuth(false);
          setAuthChecked(true);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      (async () => {
        try {
          await applyAuthUser(session?.user ?? null);
        } catch (error) {
          console.error('Auth state change handler failed:', error);
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        } finally {
          setIsLoadingAuth(false);
          setAuthChecked(true);
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applyAuthUser]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      const errorMessage = extractErrorMessage(error);
      return { data: null, error: new Error(errorMessage), profile: null };
    }

    const authUser = data?.user ?? data?.session?.user ?? null;
    let profileRow = authUser ? await fetchProfile(authUser.id) : null;

    if (authUser && !profileRow) {
      const { data: createdProfile } = await createProfileFromMetadata(authUser);
      profileRow = createdProfile || null;
    }
    
    // Apply overrides for return profile
    profileRow = getEffectiveProfile(profileRow, authUser);

    setUser(authUser);
    setProfile(profileRow);
    setIsAuthenticated(!!authUser);
    return { data, error: null, profile: profileRow };
  }, []);

  const signUp = useCallback(async (email, password, profileData = {}) => {
    const redirectTo = getAuthCallbackUrl();
    const actualRole = (profileData.role || 'citizen').toLowerCase();
    
    // EXTREMELY CRITICAL FIX: 
    // We purposefully set `role: 'citizen'` in the Auth metadata sent to Supabase.
    // Why? Supabase has a DB trigger `on_auth_user_created` that fails with a strict `CHECK CONSTRAINT` 
    // if the role is not one of the original 7 standard roles.
    // By passing 'citizen', the trigger succeeds (avoiding a 500 AuthRetryableFetchError).
    // The REAL role is saved to `requested_role` and sessionStorage.
    const safeMetadataForTrigger = {
      ...profileData,
      role: 'citizen',
      requested_role: actualRole,
    };

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: safeMetadataForTrigger,
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      return { data: null, error };
    }

    const authUser = data?.user ?? data?.session?.user ?? null;

    if (authUser?.id) {
      try {
        sessionStorage.setItem('pending_profile', JSON.stringify({ email: email.trim(), profileData: { ...profileData, role: actualRole } }));
      } catch (e) {
        console.warn('Failed to persist pending_profile after signup:', e);
      }
    }

    return { data, error: null };
  }, []);

  const logout = useCallback(async (shouldRedirect = true) => {
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }

    if (shouldRedirect) {
      window.location.href = '/login';
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    const returnTo = window.location.pathname + window.location.search;
    if (returnTo && returnTo !== '/login' && returnTo !== '/register') {
      sessionStorage.setItem('auth_return_to', returnTo);
    }
    window.location.href = '/login';
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    try {
      const redirectTo = `${window.location.origin}/login`;
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authChecked,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
        checkUserAuth,
        refreshProfile,
        signIn,
        signUp,
        sendPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
