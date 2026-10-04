import type { Asset } from '../context/AppContext';
import type { Profile } from '../data/profileQuiz';
import { PREFERENCE_INFO } from '../data/profileQuiz';
import { computeAllocation, getProfileTarget } from './allocation';

export function buildLocalDiagnostic(profile: Profile, assets: Asset[], prices: Record<string, number> = {}, question?: string): string {
  const allocation = computeAllocation(assets, prices);
  const target = getProfileTarget(profile);
  const positions = assets.map((asset) => ({
    asset,
    value: asset.quantity * (prices[asset.symbol] || asset.avgPrice),
  })).sort((a, b) => b.value - a.value);
  const largest = positions[0];
  const concentration = allocation.total > 0 && largest ? (largest.value / allocation.total) * 100 : 0;
  const gaps = (['renda_fixa', 'renda_variavel', 'internacional'] as const)
    .map((key) => ({ key, gap: target[key] - allocation.currentPct[key] }))
    .sort((a, b) => b.gap - a.gap);
  const names = { renda_fixa: 'renda fixa', renda_variavel: 'renda variável', internacional: 'internacional' };
  const focus = PREFERENCE_INFO[profile.preference || 'sem_preferencia'].label.toLowerCase();
  const positives = [
    assets.length >= 4 ? `- Você acompanha ${assets.length} posições, o que já cria uma base de diversificação.` : '- A carteira está simples o suficiente para ser acompanhada de perto.',
    `- A estratégia-alvo respeita o perfil ${profile.type} e o ${focus}.`,
    gaps[0].gap <= 3 ? '- As grandes classes estão próximas das metas definidas.' : '- O próximo aporte pode corrigir o maior desvio sem exigir vendas.',
  ];
  const risks = [
    concentration > 35 && largest ? `- ${largest.asset.symbol} representa cerca de ${concentration.toFixed(1)}% da carteira; é uma concentração que merece atenção.` : '- Nenhuma concentração extrema foi detectada pelos valores cadastrados.',
    allocation.currentPct.internacional < target.internacional - 3 ? `- A exposição internacional está ${Math.max(0, target.internacional - allocation.currentPct.internacional).toFixed(1)} pontos abaixo da meta.` : '- A exposição internacional está compatível com a meta atual.',
    assets.length < 3 ? '- Poucas posições aumentam a dependência do desempenho de cada ativo.' : '- Continue verificando correlação e setores; quantidade de ativos sozinha não garante diversificação.',
  ];
  const strongestGap = gaps.find((item) => item.gap > 0.5);
  const nextStep = strongestGap
    ? `direcione o próximo aporte prioritariamente para ${names[strongestGap.key]}, hoje ${strongestGap.gap.toFixed(1)} pontos abaixo da meta`
    : 'mantenha o aporte proporcional às metas, sem aumentar a maior posição';
  const questionLine = question?.trim() ? `\n\n💬 Sobre sua pergunta\n${answerKnownQuestion(question, nextStep, focus)}` : '';

  return `🩺 Saúde geral\nSua carteira foi analisada localmente pelo perfil ${profile.type} e pelo ${focus}. O maior ponto de decisão agora é ${strongestGap ? `corrigir ${names[strongestGap.key]}` : 'preservar o equilíbrio atual'}.\n\n✅ Pontos fortes\n${positives.join('\n')}\n\n⚠️ Riscos e pontos fracos\n${risks.join('\n')}\n\n🎯 Próximos passos\n- ${capitalize(nextStep)}.\n- Evite aportar automaticamente na maior posição só porque ela já está na carteira.\n- Revise perfil, foco e metas sempre que objetivo ou prazo mudarem.\n- Confirme custos, liquidez e riscos antes de executar qualquer compra.\n\n💬 Mensagem final\nConsistência, diversificação e aderência ao seu perfil importam mais do que copiar uma carteira pronta. Esta é uma análise educativa, não uma recomendação de investimento.${questionLine}`;
}

function answerKnownQuestion(question: string, nextStep: string, focus: string): string {
  const lower = question.toLowerCase();
  if (lower.includes('500') || lower.includes('aportar') || lower.includes('aporte')) return `Para este momento, ${nextStep}. Dentro da classe indicada, escolha ativos coerentes com o ${focus} e com preço que caiba no valor disponível.`;
  if (lower.includes('risco') || lower.includes('concentr')) return 'Priorize reduzir concentração por meio de novos aportes, sem vender por impulso. Observe peso por ativo, classe e exposição internacional.';
  if (lower.includes('dividend')) return `O foco declarado é ${focus}. Avalie renda recebida, sustentabilidade dos pagamentos e diversificação; dividend yield isolado não basta.`;
  return `A resposta mais coerente com os dados atuais é: ${nextStep}. Reavalie a decisão se objetivo, prazo ou tolerância a risco mudarem.`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
