// @ts-ignore
import PostalMime from 'postal-mime';
type PostalMime = import("../../../../../node_modules/postal-mime/postal-mime").default;

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url)
    const zone = searchParams.get('zone')

    const body = await request.json()
    const { email: rawEmail, from, to } = body

    const parser = new PostalMime() as PostalMime
    const email = await parser.parse(rawEmail as string);
    console.log(JSON.stringify(email, null, 2))
    console.log({ from, to })

    return Response.json({})
}