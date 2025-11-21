import { RuleGroupType, Field } from 'react-querybuilder';

export interface JoinConfig {
  type: 'INNER' | 'LEFT' | 'RIGHT';
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
}

export type ConnectionStatus = 'checking' | 'connected' | 'error';

export interface QueryState {
  query: RuleGroupType;
  selectedTable: string;
  fields: Field[];
  joins: JoinConfig[];
  data: any[];
}