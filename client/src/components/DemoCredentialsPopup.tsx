"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Shows demo credentials on first load (per browser) using localStorage flag
export default function DemoCredentialsPopup() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOpen(true);
  }, []);

  const email = "demo@example.com"; // ensure matches your Clerk demo user
  const password = "DemoPass!123";

  if (!mounted) return null; // avoid SSR/CSR mismatch

  return (
    <Dialog modal={false} open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Demo Account</DialogTitle>
          <DialogDescription>
            Use these credentials to view features of the app.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-gray-400">Email</span>
            <code className="px-2 py-1 rounded bg-customgreys-secondarybg text-white-50 text-xs break-all">
              {email}
            </code>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-400">Password</span>
            <code className="px-2 py-1 rounded bg-customgreys-secondarybg text-white-50 text-xs">
              {password}
            </code>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            You can sign in, explore enrolled courses, and test progress
            features. Avoid storing sensitive data in this demo account.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="default" size="sm">
              Got it
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
