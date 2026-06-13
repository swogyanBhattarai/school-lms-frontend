"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { me } from "@/lib/api/auth";
import { getSchoolNameById } from "@/lib/api/school";
import { AUTH_REDIRECT_EVENT_NAME } from "@/lib/api/auth/utils";
import type { CurrentUserInfoResponse } from "@/types/lms";

type User = {
  username?: string;
  userRole?: string;
  schoolId?: number;
  schoolName?: string;
};

type UserContextType = {
  user: User | null;
  loading: boolean;
  isHydrated: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;

    const handleAuthRedirect = (event: Event) => {
      event.preventDefault();
      router.replace("/login");
    };

    window.addEventListener(AUTH_REDIRECT_EVENT_NAME, handleAuthRedirect);

    return () => {
      window.removeEventListener(AUTH_REDIRECT_EVENT_NAME, handleAuthRedirect);
    };
  }, [isHydrated, router]);

  useEffect(() => {
    if (!isHydrated) return;

    let isMounted = true;

    const loadUser = async () => {
      try {
        setLoading(true);
        const currentUser: CurrentUserInfoResponse = await me();

        if (!isMounted) return;

        setUser({
          username: currentUser.username,
          userRole: currentUser.userRole,
          schoolId: currentUser.schoolId,
        });

        if (currentUser.schoolId) {
          try {
            const schoolName = await getSchoolNameById(currentUser.schoolId);

            if (!isMounted) return;

            setUser((current) =>
              current ? { ...current, schoolName } : current,
            );
          } catch (schoolError) {
            if (!isMounted) return;

            console.error("Failed to get school name:", schoolError);
          }
        }
      } catch (error) {
        if (!isMounted) return;

        console.error("Failed to get current user:", error);
        setUser(null);
        router.replace("/login");
      } finally {
        if (!isMounted) return;

        setLoading(false);
      }
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, [isHydrated, router]);

  return (
    <UserContext.Provider value={{ user, loading, isHydrated }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
