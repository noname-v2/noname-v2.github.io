import type { Section, Extension } from '../../worker/extension';
import type { GameAccessor } from '../../worker/game-acc';
import type { StageAccessor } from '../../worker/stage-acc';

interface GameSGS extends GameAccessor {
    rootStage: StageSGS;
    activeStage: StageSGS | null;
    [key: string]: any;
}

export interface StageSGS extends StageAccessor {
    game: GameSGS;
    parent: StageSGS | null;
    siblings: StageSGS[];
    getSibling: (select: string | number) => StageSGS | null;
    add: (content: string) => StageSGS;
    addSibling: (content: string) => StageSGS;
    [key: string]: any;
}

interface SectionSGS extends Section {
    content?: (this: StageSGS, ...args: any[]) => any;
    contents?: {[key: string]: (this: StageSGS, ...args: any[]) => any};
}

export interface CollectionSGS {
    [key: string]: SectionSGS | ((stage: StageSGS) => any);
}

export interface SGS extends Extension {
    mode?: SectionSGS;
    skill?: CollectionSGS;
    card?: CollectionSGS;
    hero?: CollectionSGS;
}