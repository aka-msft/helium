import {
    Equals,
    IsAlphanumeric,
    IsLowercase,
    IsNotEmpty,
    NotEquals,
    validate,
    ValidateIf,
    ValidationArguments,
    ValidationError,
} from "class-validator";
import { IsEqualToProperty } from "../../utilities/validationUtilities";
import { IValidatable } from "./ivalidatable";
import { Movie } from "./movie";

export class Actor implements IValidatable {

    @IsNotEmpty()
    @IsAlphanumeric()
    public id: string;

    @IsNotEmpty()
    @IsAlphanumeric()
    public actorId: string;

    @ValidateIf((x) => x.name !== undefined)
    @IsEqualToProperty("name", (x) => (x as string).toLowerCase(),
        {
            message: (args: ValidationArguments) => {
                if ((args.object as Actor).name !== undefined) {
                    return `textSearch must be equal to ${(args.object as Actor).name.toLowerCase()}`;
                } else {
                    return `textSearch must equal the lowercased version of the object's ${args.targetName} property`;
                }
            },
        })
    @IsLowercase()
    public textSearch: string;

    @IsNotEmpty()
    @NotEquals((x) => x.trim.length() > 0)
    public name: string;

    @Equals("Actor")
    public type: string;

    constructor(
        id: string,
        actorId: string,
        name: string,
        textSearch: string,
        public key?: number,
        public birthYear?: number,
        public profession?: string[],
        public movies?: Movie[]) {
        this.id = id;
        this.actorId = actorId;
        this.name = name;
        this.textSearch = textSearch;
        this.type = "Actor";
        this.key = key;
        this.birthYear = birthYear;
        this.profession = profession;
        this.movies = movies;
    }

    public validate(): Promise<ValidationError[]> {
        return validate(this);
    }
}
