import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
) {
    try {
        const body = request.json();
        console.log(body);
        await new Promise(resolve => {
            setTimeout(resolve, 3000);
        })
        /*
        const weatherResponse = await fetch(`${weatherEndpoint}?${searchParams}`)
        if (!weatherResponse.ok) {
           https://nextjs.org/docs/app/guides/backend-for-frontend#manipulating-data
        }
        const weatherData = await weatherResponse.text()
        const payload = parseWeatherData.asJSON(weatherData)
    */

        return NextResponse.json({ content: `<h1>Hello unknown!</h1>` });
    } catch(reason) {
        const message =
            reason instanceof Error ? reason.message : 'Unexpected exception'
        return new Response(message, { status: 500 })
    }
}
