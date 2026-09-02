import DefaultTheme from 'vitepress/theme-without-fonts';
import Layout from './layouts/Layout.vue';
import { useRoute, useRouter } from 'vitepress';
import { watch, onMounted } from 'vue';

// Privacy & Decryption
import * as Decryptor from '../scripts/Decryptor';

// Replacers
import ec from './components/replacers/ec.vue';
import ecp from './components/replacers/ecp.vue';
import np from './components/replacers/np.vue';
import tc from './components/replacers/tc.vue';

// UI Components
import ArticleMeta from './components/ArticleMeta.vue';
import ArticleFootnote from './components/ArticleFootnote.vue';
import CopyPageButton from './components/CopyPageButton.vue';
import HomePage from './layouts/HomePage.vue';
import Periods from './components/periods/Periods.vue';
import NewPeriod from './components/periods/NewPeriod.vue';
import Feat from './components/Feat.vue';
import CardList from './components/CardList.vue';
import Card from './components/Card.vue';
import Img from './components/Img.vue';
import Video from './components/Video.vue';
import ImageViewer from './components/ImageViewer.vue';
import Timeline from './components/Timeline.vue';
import TimelineItem from './components/TimelineItem.vue';
import CryptoDebugger from './components/CryptoDebugger.vue';
import FriendLinks from './components/FriendLinks.vue';
import FrontmatterExpansion from './components/FrontmatterExpansion.vue';
import NoteCards from './components/NoteCards.vue';
import PointList from './components/PointList.vue';
import PointItem from './components/PointItem.vue';
import AI from './components/AI.vue';

// CSS
import './custom.css';

export default {
  Layout,
  extends: DefaultTheme,
  setup() {
    const route = useRoute();
    const router = useRouter();

    onMounted(async () => {
      console.log('Vue mounted.');
      if (typeof document !== 'undefined') {
        await import('./plugins/naranja.js');
        await import('./plugins/popup.js');
        await import('./plugins/switch');
      }
        console.log('Decrypting...');
        Decryptor.tryDecrypt();
        if (typeof window !== 'undefined') {
          console.log('Running in browser');
        } else {
          console.log('Not in browser (GitHub Actions or other environments)');
        }
    });

    watch(
      () => route.path,
      () => {
        console.log("Route changed");
        console.log('Decrypting...');
        Decryptor.tryDecrypt();
      }
    );
  },
  enhanceApp({ app }) {
    app.component('ec',ec);
    app.component('np',np);
    app.component('ecp',ecp);
    app.component('tc',tc);
    app.component('ArticleMeta', ArticleMeta);
    app.component('ArticleFootnote', ArticleFootnote);
    app.component('CopyPageButton', CopyPageButton);
    app.component('HomePage', HomePage);
    app.component('NewPeriods', Periods);
    app.component('NewPeriod', NewPeriod);
    app.component('Feat', Feat);
    app.component('CardList', CardList);
    app.component('Card', Card);
    app.component('Img', Img);
    app.component('Video', Video);
    app.component('VideoPlayer', Video);
    app.component('ImageViewer', ImageViewer);
    app.component('Timeline', Timeline);
    app.component('TimelineItem', TimelineItem);
    app.component('CryptoDebugger', CryptoDebugger);
    app.component('FriendLinks', FriendLinks);
    app.component('FrontmatterExpansion', FrontmatterExpansion);
    app.component('NoteCards', NoteCards);
    app.component('PointList', PointList);
    app.component('PointItem', PointItem);
    app.component('IdeaList', PointList);
    app.component('IdeaItem', PointItem);
    app.component('AI', AI);
    app.component('ai', AI);
    app.component('AiBlock', AI);
  }
};
