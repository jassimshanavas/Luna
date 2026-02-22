import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Luna — Your Cycle Companion'
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = 'image/png'

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'serif',
                }}
            >
                <div
                    style={{
                        fontSize: 160,
                        marginBottom: 20,
                    }}
                >
                    🌸
                </div>
                <div
                    style={{
                        fontSize: 100,
                        fontWeight: 'bold',
                        color: '#be185d',
                        marginBottom: 10,
                    }}
                >
                    Luna
                </div>
                <div
                    style={{
                        fontSize: 40,
                        color: '#db2777',
                        opacity: 0.8,
                    }}
                >
                    Your Cycle Companion
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
