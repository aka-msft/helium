import { ValidationError } from "class-validator";

export interface IValidatable {
    validate(): Promise<ValidationError[]>;
}
