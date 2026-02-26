import type { Unit, UnitState } from '@prisma/client';
import crt from '@/lib/rules/closeCombatCRT.json';

export type CloseCombatInputs = {
  attackerUnitIds: string[];
  defenderUnitIds: string[];
  attackerCppOverride?: number;
  defenderCppOverride?: number;
  columnShifts?: number;
  notes?: string;
};

export type Effect = {
  unitId: string;
  deltaCpp?: number;
  setDestroyed?: boolean;
  setSuppressedFire?: boolean;
  setSuppressedCyber?: boolean;
  setSuppressedEW?: boolean;
};

type UnitWithState = Unit & { unitState: UnitState | null };

const codeToEffects = (code: string, attackers: UnitWithState[], defenders: UnitWithState[]): Effect[] => {
  switch (code) {
    case 'AE':
      return attackers.map((u) => ({ unitId: u.id, setDestroyed: true, deltaCpp: -999 }));
    case 'AR':
      return attackers.map((u) => ({ unitId: u.id, deltaCpp: -1, setSuppressedFire: true }));
    case 'DR':
      return defenders.map((u) => ({ unitId: u.id, deltaCpp: -1, setSuppressedFire: true }));
    case 'DE':
      return defenders.map((u) => ({ unitId: u.id, setDestroyed: true, deltaCpp: -999 }));
    case 'EX':
      return [
        ...attackers.map((u) => ({ unitId: u.id, deltaCpp: -1 })),
        ...defenders.map((u) => ({ unitId: u.id, deltaCpp: -1 }))
      ];
    default:
      return [];
  }
};

const getUnitNames = (units: UnitWithState[]) => units.map((u) => u.name).join(', ');

export const computeOddsLabel = (attackerCPP: number, defenderCPP: number): string => {
  const safeDef = defenderCPP <= 0 ? 1 : defenderCPP;
  if (attackerCPP >= safeDef) {
    return `${Math.max(1, Math.round(attackerCPP / safeDef))}:1`;
  }
  return `1:${Math.max(1, Math.round(safeDef / Math.max(attackerCPP, 1)))}`;
};

const resolveBaseColumn = (ratio: number): string => {
  const match = crt.oddsThresholds.find((row) => ratio <= row.max);
  return match?.column ?? '1:1';
};

const applyColumnShift = (baseColumn: string, shift: number): string => {
  const idx = crt.columns.indexOf(baseColumn);
  const shifted = Math.min(crt.columns.length - 1, Math.max(0, idx + shift));
  return crt.columns[shifted];
};

export const computeCloseCombatProposal = ({
  inputs,
  dieRoll,
  attackers,
  defenders,
  gameName,
  turnNumber,
  phase
}: {
  inputs: CloseCombatInputs;
  dieRoll: number;
  attackers: UnitWithState[];
  defenders: UnitWithState[];
  gameName: string;
  turnNumber: number;
  phase: string;
}) => {
  const attackerCPP =
    inputs.attackerCppOverride ?? attackers.reduce((sum, u) => sum + (u.unitState?.cppCurrent ?? 0), 0);
  const defenderCPP =
    inputs.defenderCppOverride ?? defenders.reduce((sum, u) => sum + (u.unitState?.cppCurrent ?? 0), 0);

  const ratio = attackerCPP / Math.max(defenderCPP, 1);
  const baseColumn = resolveBaseColumn(ratio);
  const finalColumn = applyColumnShift(baseColumn, inputs.columnShifts ?? 0);
  const outcomeCode = crt.results[String(dieRoll) as keyof typeof crt.results]?.[
    finalColumn as keyof (typeof crt.results)['1']
  ] as string;

  const effects = codeToEffects(outcomeCode, attackers, defenders);
  const outcomeSummary = `${outcomeCode} (${crt.codes[outcomeCode as keyof typeof crt.codes]})`;

  const chatLine = `[${gameName}] T${turnNumber} ${phase} — CLOSE COMBAT: ${getUnitNames(attackers)} vs ${getUnitNames(defenders)} | Odds ${computeOddsLabel(attackerCPP, defenderCPP)} (col ${finalColumn}) | D10=${dieRoll} | FINAL=${outcomeSummary}`;

  return {
    attackerCPP,
    defenderCPP,
    oddsLabel: computeOddsLabel(attackerCPP, defenderCPP),
    baseColumn,
    finalColumn,
    dieRoll,
    outcome: {
      code: outcomeCode,
      summary: outcomeSummary
    },
    effects,
    chatLine
  };
};
