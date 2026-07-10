import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-background px-6 py-16 text-center">
      <Image
        src="/logo-lu-fortuna.png"
        alt="Lu Fortuna Polesport"
        width={220}
        height={220}
        priority
      />
      <div className="flex max-w-md flex-col gap-3">
        <h1 className="text-2xl font-semibold text-black">
          Fichas de evolução — Lu Fortuna Polesport
        </h1>
        <p className="text-terciaria">
          Login e telas de Aluno, Professor e Admin em construção.
        </p>
      </div>
      <span className="rounded-full bg-primaria px-4 py-2 text-sm font-medium text-primaria-texto">
        Em desenvolvimento
      </span>
    </div>
  );
}
