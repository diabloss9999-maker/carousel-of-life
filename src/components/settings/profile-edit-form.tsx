"use client";

import { useActionState, useState } from "react";
import { Loader2, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateProfileAction,
  type ProfileFormState,
} from "@/lib/auth/profile-action";

interface ProfileEditFormProps {
  displayName: string;
  mbti: string | null;
  birthPlace: string | null;
}

const initial: ProfileFormState = { kind: "idle" };

export function ProfileEditForm({
  displayName,
  mbti,
  birthPlace,
}: ProfileEditFormProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initial,
  );

  if (!editing) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
        정보 수정
      </Button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await formAction(fd);
        if (state.kind !== "error") setEditing(false);
      }}
      className="space-y-4 pt-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">정보 수정</p>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-name">이름</Label>
        <Input
          id="edit-name"
          name="displayName"
          defaultValue={displayName}
          maxLength={40}
          required
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="edit-mbti">MBTI</Label>
          <Input
            id="edit-mbti"
            name="mbti"
            defaultValue={mbti ?? ""}
            maxLength={4}
            placeholder="예: INFP"
            className="uppercase"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-birthPlace">출생지</Label>
          <Input
            id="edit-birthPlace"
            name="birthPlace"
            defaultValue={birthPlace ?? ""}
            maxLength={80}
            placeholder="예: 서울"
            disabled={isPending}
          />
        </div>
      </div>

      <FormMessage
        state={
          state.kind === "error"
            ? { kind: "error", message: state.message ?? "" }
            : state.kind === "success"
              ? { kind: "success", message: state.message ?? "" }
              : { kind: "idle" }
        }
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setEditing(false)}
          disabled={isPending}
        >
          취소
        </Button>
        <Button type="submit" size="sm" className="flex-1" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "저장"
          )}
        </Button>
      </div>
    </form>
  );
}
