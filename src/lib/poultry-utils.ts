export interface DensityGuideline {
  label: string;
  minM2PerBird: number;
  maxBirdsPerM2: number;
  description: string;
}

export const EMBRAPA_DENSITY: Record<string, Record<string, DensityGuideline>> = {
  galpao: {
    postura: {
      label: "Postura Colonial",
      minM2PerBird: 0.2,
      maxBirdsPerM2: 5,
      description: "Até 5 aves/m² em galpão com acesso a piquete",
    },
    corte: {
      label: "Corte Colonial",
      minM2PerBird: 0.25,
      maxBirdsPerM2: 4,
      description: "Até 4 aves/m² para frangos de corte",
    },
    misto: {
      label: "Misto Colonial",
      minM2PerBird: 0.25,
      maxBirdsPerM2: 4,
      description: "Até 4 aves/m² para sistema misto",
    },
  },
  piquete_rotativo: {
    postura: {
      label: "Postura em Piquete",
      minM2PerBird: 3,
      maxBirdsPerM2: 0.33,
      description: "Mínimo 3 m²/ave em piquete rotativo",
    },
    corte: {
      label: "Corte em Piquete",
      minM2PerBird: 4,
      maxBirdsPerM2: 0.25,
      description: "Mínimo 4 m²/ave em piquete rotativo",
    },
    misto: {
      label: "Misto em Piquete",
      minM2PerBird: 3.5,
      maxBirdsPerM2: 0.29,
      description: "Mínimo 3,5 m²/ave em piquete rotativo",
    },
  },
  pinteiro: {
    cria: {
      label: "Cria (Pinteiro)",
      minM2PerBird: 0.05,
      maxBirdsPerM2: 20,
      description: "Até 20 pintinhos/m² nas primeiras semanas (fase de aquecimento)",
    },
  },
};

export const SANITARY_VOID_MIN_DAYS = 15;
export const SANITARY_VOID_MAX_DAYS = 21;

export function calculateSuggestedCapacity(
  locationType: string,
  areaM2: number,
  purpose: string = "postura"
): number {
  const typeData = EMBRAPA_DENSITY[locationType];
  if (!typeData || !areaM2) return 0;
  const guideline = typeData[purpose] || typeData[Object.keys(typeData)[0]];
  if (!guideline) return 0;
  return Math.floor(areaM2 * guideline.maxBirdsPerM2);
}

export function calculateDensity(totalBirds: number, areaM2: number): {
  birdsPerM2: number;
  m2PerBird: number;
} {
  if (!areaM2 || areaM2 <= 0 || totalBirds <= 0) {
    return { birdsPerM2: 0, m2PerBird: 0 };
  }
  return {
    birdsPerM2: totalBirds / areaM2,
    m2PerBird: areaM2 / totalBirds,
  };
}

export function getDensityStatus(
  locationType: string,
  purposes: string[],
  totalBirds: number,
  areaM2: number
): {
  level: "ok" | "warning" | "critical";
  message: string;
  guideline: DensityGuideline | null;
} {
  const typeData = EMBRAPA_DENSITY[locationType];
  if (!typeData || !areaM2 || totalBirds === 0) {
    return { level: "ok", message: "", guideline: null };
  }

  let guideline: DensityGuideline | null = null;

  if (locationType === "pinteiro") {
    guideline = typeData.cria;
  } else {
    const available = purposes
      .map((p) => typeData[p])
      .filter(Boolean) as DensityGuideline[];

    if (available.length === 0) {
      guideline = typeData[Object.keys(typeData)[0]] || null;
    } else if (available.length === 1) {
      guideline = available[0];
    } else {
      guideline = available.reduce((most, current) =>
        current.maxBirdsPerM2 < most.maxBirdsPerM2 ? current : most
      );
    }
  }

  if (!guideline) {
    return { level: "ok", message: "", guideline: null };
  }

  const { birdsPerM2 } = calculateDensity(totalBirds, areaM2);
  const maxAllowed = guideline.maxBirdsPerM2;

  if (birdsPerM2 > maxAllowed * 1.2) {
    return {
      level: "critical",
      message: `Superpopulação crítica! ${birdsPerM2.toFixed(1)} aves/m² (máx: ${maxAllowed})`,
      guideline,
    };
  }

  if (birdsPerM2 > maxAllowed) {
    return {
      level: "warning",
      message: `Densidade acima do recomendado: ${birdsPerM2.toFixed(1)} aves/m² (máx: ${maxAllowed})`,
      guideline,
    };
  }

  return {
    level: "ok",
    message: `Densidade adequada: ${birdsPerM2.toFixed(1)} aves/m²`,
    guideline,
  };
}

export function getSanitaryVoidStatus(sanitaryVoidStart: Date | string | null): {
  daysElapsed: number;
  isComplete: boolean;
  daysRemaining: number;
  progressPercent: number;
  message: string;
} {
  if (!sanitaryVoidStart) {
    return {
      daysElapsed: 0,
      isComplete: false,
      daysRemaining: SANITARY_VOID_MIN_DAYS,
      progressPercent: 0,
      message: "Data de início não definida",
    };
  }

  const start = new Date(sanitaryVoidStart);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, SANITARY_VOID_MIN_DAYS - daysElapsed);
  const progressPercent = Math.min(100, (daysElapsed / SANITARY_VOID_MIN_DAYS) * 100);
  const isComplete = daysElapsed >= SANITARY_VOID_MIN_DAYS;

  if (isComplete) {
    return {
      daysElapsed,
      isComplete: true,
      daysRemaining: 0,
      progressPercent: 100,
      message: `Vazio sanitário completo (${daysElapsed} dias). Local liberado!`,
    };
  }

  return {
    daysElapsed,
    isComplete: false,
    daysRemaining,
    progressPercent,
    message: `Vazio sanitário: ${daysElapsed}/${SANITARY_VOID_MIN_DAYS} dias`,
  };
}

export const locationTypeLabels: Record<string, string> = {
  galpao: "Galpão",
  piquete_rotativo: "Piquete Rotativo",
  pinteiro: "Pinteiro",
};

export const locationStatusLabels: Record<string, string> = {
  liberado: "Liberado",
  vazio_sanitario: "Vazio Sanitário",
};

export const locationStatusColors: Record<string, string> = {
  liberado: "bg-green-100 text-green-800",
  vazio_sanitario: "bg-amber-100 text-amber-800",
};

export const locationTypeColors: Record<string, string> = {
  galpao: "bg-slate-100 text-slate-800",
  piquete_rotativo: "bg-emerald-100 text-emerald-800",
  pinteiro: "bg-orange-100 text-orange-800",
};
