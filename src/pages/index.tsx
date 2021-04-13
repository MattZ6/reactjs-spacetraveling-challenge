import { useCallback, useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';

import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { dateFormater } from '../utils/dateFormater';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);

  const handleLoadMore = useCallback(async () => {
    if (!postsPagination.next_page) {
      return;
    }

    try {
      const response = await fetch(postsPagination.next_page);

      const data = await response.json();

      setPosts(state => [...state, ...data.results]);
      setNextPage(data.next_page);
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert('Não foi possível carregar mais posts :(');
    }
  }, [postsPagination]);

  return (
    <>
      <Head>
        <title>Home — spacetravelling </title>
      </Head>

      <Header />

      <main className={commonStyles.maxWidthContainer}>
        <section>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a className={styles.post}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>

                <div className={styles.postInfo}>
                  <div>
                    <FiCalendar size={20} />
                    <span>{dateFormater(post.first_publication_date)}</span>
                  </div>
                  <div>
                    <FiUser size={20} />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </section>

        {nextPage && (
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={handleLoadMore}
          >
            Carregar mais posts
          </button>
        )}

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={commonStyles.preview}>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
}) => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  const posts = response.results.map<Post>(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        next_page: response.next_page,
        results: posts,
      },
      preview,
    },
    revalidate: 60 * 1, // 1hr
  };
};
