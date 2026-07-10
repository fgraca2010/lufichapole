import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const cores = {
  primaria: "#00A887",
  terciaria: "#383838",
  preto: "#000000",
  cinzaClaro: "#E5E5E5",
};

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica" },
  cabecalho: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  logo: { width: 40, height: 40 },
  tituloMarca: { fontSize: 12, fontWeight: 700, color: cores.primaria },
  subtitulo: { fontSize: 9, color: cores.terciaria },
  infoAluno: { marginBottom: 10, flexDirection: "row", justifyContent: "space-between" },
  bloco: { marginBottom: 8 },
  tituloBloco: { fontSize: 10, fontWeight: 700, color: cores.terciaria, marginBottom: 3 },
  linhaMovimento: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: cores.cinzaClaro,
  },
  categoria: {
    width: 14,
    fontSize: 8,
    fontWeight: 700,
    color: cores.terciaria,
  },
  nomeMovimento: { flex: 1, fontSize: 8.5, color: cores.preto },
  caixas: { flexDirection: "row", gap: 2 },
  caixa: {
    width: 9,
    height: 9,
    borderWidth: 0.7,
    borderColor: cores.terciaria,
  },
  caixaPreenchida: {
    backgroundColor: cores.primaria,
  },
  rodape: {
    position: "absolute",
    bottom: 16,
    left: 28,
    right: 28,
    fontSize: 7,
    color: cores.terciaria,
    textAlign: "center",
  },
});

type Movimento = {
  id: number;
  nome: string;
  categoria: string | null;
  sucessosConsecutivos: number;
  aprovado: boolean;
};

type Bloco = {
  numero: number;
  movimentos: Movimento[];
};

export function FichaPdfDocument({
  logoBase64,
  nivelNumero,
  nomeAluno,
  sucessosNecessarios,
  blocos,
  geradoEm,
}: {
  logoBase64: string;
  nivelNumero: number;
  nomeAluno: string;
  sucessosNecessarios: number;
  blocos: Bloco[];
  geradoEm: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.cabecalho}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- <Image> aqui é do @react-pdf/renderer, não HTML */}
          <Image src={logoBase64} style={styles.logo} />
          <View>
            <Text style={styles.tituloMarca}>Lu Fortuna Polesport</Text>
            <Text style={styles.subtitulo}>Ficha de evolução — Nível {nivelNumero}</Text>
          </View>
        </View>

        <View style={styles.infoAluno}>
          <Text>Aluno(a): {nomeAluno}</Text>
          <Text>Gerado em: {geradoEm}</Text>
        </View>

        {blocos.map((bloco) => (
          <View key={bloco.numero} style={styles.bloco} wrap={false}>
            <Text style={styles.tituloBloco}>Bloco {bloco.numero}</Text>
            {bloco.movimentos.map((mov) => (
              <View key={mov.id} style={styles.linhaMovimento}>
                <Text style={styles.categoria}>{mov.categoria ?? ""}</Text>
                <Text style={styles.nomeMovimento}>{mov.nome}</Text>
                <View style={styles.caixas}>
                  {Array.from({ length: sucessosNecessarios }).map((_, i) => {
                    const preenchida = mov.aprovado || i < mov.sucessosConsecutivos;
                    return (
                      <View
                        key={i}
                        style={preenchida ? [styles.caixa, styles.caixaPreenchida] : styles.caixa}
                      />
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.rodape}>
          Lu Fortuna Polesport — ficha gerada automaticamente pelo sistema, use pra anotar seu treino sem celular.
        </Text>
      </Page>
    </Document>
  );
}
