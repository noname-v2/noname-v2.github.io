import { Link, LinkData } from './link';

export interface SkillData extends LinkData {
    name: string;
}

export class Skill extends Link<SkillData> {

}