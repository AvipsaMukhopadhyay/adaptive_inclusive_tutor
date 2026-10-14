/** Every animated scene, by id. The server picks a scene id for each lesson step (Imagery.java). */
import { SCENES as CORE } from './scenes.jsx'
import { MATH_SCENES } from './scenesMath.jsx'
import { SCIENCE_SCENES } from './scenesScience.jsx'
import { SOCIETY_SCENES } from './scenesSociety.jsx'

export const SCENES = { ...CORE, ...MATH_SCENES, ...SCIENCE_SCENES, ...SOCIETY_SCENES }
