import Image from "next/image";

export function Avatar({
  avatarUrl,
  nome,
  tamanho = 24,
}: {
  avatarUrl: string | null | undefined;
  nome: string;
  tamanho?: number;
}) {
  if (!avatarUrl) return null;

  return (
    <Image
      src={avatarUrl}
      alt={`Foto de ${nome}`}
      width={tamanho}
      height={tamanho}
      className="shrink-0 rounded-full object-cover"
      style={{ width: tamanho, height: tamanho }}
    />
  );
}
