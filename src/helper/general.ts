
type TPostType = "dev" | "design";


export function generate_post_id (prefix : TPostType) : string{
    const date = new Date().getTime();
    return `${prefix}${date}`;
}