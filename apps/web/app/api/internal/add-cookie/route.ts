import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const response = new NextResponse('OK');

    // Add each search param as a cookie
    searchParams.forEach((value, key) => {
        response.cookies.set(key, value);
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
}
