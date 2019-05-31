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
import { Actor } from "./actor";
import { IValidatable } from "./ivalidatable";

export class Movie implements IValidatable {

    @IsNotEmpty()
    @IsAlphanumeric()
    public id: string;

    @IsNotEmpty()
    @IsAlphanumeric()
    public movieId: string;

    @ValidateIf((x) => x.title !== undefined)
    @IsEqualToProperty("title", (x) => (x as string).toLowerCase(),
        {
            message: (args: ValidationArguments) => {
                if ((args.object as Movie).title !== undefined) {
                    return `textSearch must be equal to ${(args.object as Movie).title.toLowerCase()}`;
                } else {
                    return `textSearch must equal the lowercased version of the object's ${args.targetName} property`;
                }
            },
        })
    @IsLowercase()
    public textSearch: string;

    @IsNotEmpty()
    @NotEquals((x) => x.trim.length() > 0)
    public title: string;

    @Equals("Movie")
    public type: string;

    constructor(
        id: string,
        movieId: string,
        title: string,
        textSearch: string,
        public key?: string,
        public year?: number,
        public rating?: number,
        public votes?: number,
        public genres?: string[],
        public roles?: Actor[]) {
        this.id = id;
        this.movieId = movieId;
        this.title = title;
        this.textSearch = textSearch;
        this.type = "Movie";
        this.key = key;
        this.year = year;
        this.rating = rating;
        this.votes = votes;
        this.genres = genres;
        this.roles = roles;
    }

    public validate(): Promise<ValidationError[]> {
        return validate(this);
    }
}
