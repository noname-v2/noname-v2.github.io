import { Linked } from './linked';
import type { Link } from '../types';

export interface SkillLink extends Link {
    name: string;
}

export class Skill extends Linked<SkillLink> {

}