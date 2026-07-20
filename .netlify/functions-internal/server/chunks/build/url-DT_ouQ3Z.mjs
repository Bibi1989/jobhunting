import { aO as getRequestURL } from '../nitro/nitro.mjs';
import { d as useRequestEvent } from './server.mjs';

function useRequestURL(opts) {
  {
    return getRequestURL(useRequestEvent(), opts);
  }
}

export { useRequestURL as u };
//# sourceMappingURL=url-DT_ouQ3Z.mjs.map
