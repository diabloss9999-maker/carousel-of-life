import type { CharacterId } from "@/lib/chat/characters";

interface EntityWhisperProps {
  characterId: CharacterId;
}

export function EntityWhisper({ characterId: _characterId }: EntityWhisperProps) {
  void _characterId;
  return null;
}
