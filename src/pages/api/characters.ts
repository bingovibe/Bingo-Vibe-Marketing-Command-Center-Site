
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const characters = await prisma.character.findMany({
        orderBy: { name: 'asc' }
      })
      
      res.status(200).json(characters)
    } catch (error) {
      console.error('Error fetching characters:', error)
      res.status(500).json({ error: 'Failed to fetch characters' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
