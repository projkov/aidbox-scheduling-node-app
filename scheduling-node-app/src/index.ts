import { main as mainAidbox } from './aidbox';
import { main as mainStandalone } from './standalone';

if (require.main === module) {
  if (process.env.APP_ID) {
    mainAidbox();
  } else {
    mainStandalone();
  }
}
