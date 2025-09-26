import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const getAssetsPath = () => path.resolve(dirname, '../assets')
