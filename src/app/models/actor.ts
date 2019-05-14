import {
    Equals,
    IsAlphanumeric,
    IsLowercase,
    IsNotEmpty,
    NotEquals,
    validate,
    ValidateIf,
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
            message: "textSearch must equal the lowercase version of 'name'",
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
