import tempfile
import textwrap
import unittest
import subprocess
import sys
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from unittest.mock import patch

import add_project


PORTFOLIO_FIXTURE = textwrap.dedent(
    """\
    export const PERSONAL_INFO = {
      bio: [
        'With 2+ deployed production units and 34 public repositories, I build useful software.'
      ],
      stats: {
        deployedProjects: 2,
      }
    };

    export const PROJECTS: Project[] = [
      {
        id: 'first-project',
        title: 'First Project',
        keyFeatures: ['One'],
        technologies: ['TypeScript'],
        githubUrl: 'https://github.com/roco007/first-project',
        sysId: 'SYS.001'
      },
      {
        id: 'second-project',
        title: 'Second Project',
        keyFeatures: ['Two'],
        technologies: ['React'],
        githubUrl: 'https://github.com/roco007/second-project',
        sysId: 'SYS.002'
      }
    ];

    export const EXPERIENCE = [];
    """
)


class AddProjectTests(unittest.TestCase):
    @staticmethod
    def make_project(**overrides):
        values = {
            'id': 'ocean-edge',
            'title': "Ocean's Edge",
            'category': 'interactive',
            'category_label': '3D & Interactive Apps',
            'description': "A tide explorer's story.",
            'problem_solved': 'Makes a short browser adventure easy to start.',
            'key_features': ('Changing tide routes', 'Keyboard and touch controls'),
            'technologies': ('TypeScript', 'Phaser 3'),
            'github_url': 'https://github.com/roco007/OceanEdge',
            'live_url': 'https://ocean-edge.example.com',
            'image': 'images/ocean-edge.webp',
            'featured': True,
        }
        values.update(overrides)
        return add_project.ProjectEntry(**values)

    def test_appends_complete_project_to_portfolio_source(self):
        self.assertTrue(
            hasattr(add_project, 'ProjectEntry')
            and hasattr(add_project, 'append_project_to_portfolio'),
            'add_project.py must expose the portfolio.ts append workflow',
        )

        with tempfile.TemporaryDirectory() as temporary_directory:
            portfolio_path = Path(temporary_directory) / 'src' / 'data' / 'portfolio.ts'
            portfolio_path.parent.mkdir(parents=True)
            portfolio_path.write_text(PORTFOLIO_FIXTURE, encoding='utf-8')

            project = self.make_project()

            total = add_project.append_project_to_portfolio(portfolio_path, project)
            updated = portfolio_path.read_text(encoding='utf-8')

        self.assertEqual(total, 3)
        self.assertLess(updated.index("id: 'first-project'"), updated.index("id: 'second-project'"))
        self.assertLess(updated.index("id: 'second-project'"), updated.index('id: "ocean-edge"'))
        self.assertLess(updated.index('id: "ocean-edge"'), updated.index('export const EXPERIENCE'))
        self.assertIn('title: "Ocean\'s Edge"', updated)
        self.assertIn('category: "interactive"', updated)
        self.assertIn('categoryLabel: "3D & Interactive Apps"', updated)
        self.assertIn('problemSolved: "Makes a short browser adventure easy to start."', updated)
        self.assertIn('keyFeatures: [', updated)
        self.assertIn('technologies: [', updated)
        self.assertIn('githubUrl: "https://github.com/roco007/OceanEdge"', updated)
        self.assertIn('liveUrl: "https://ocean-edge.example.com"', updated)
        self.assertIn('image: "images/ocean-edge.webp"', updated)
        self.assertIn("sysId: 'SYS.001'", updated)
        self.assertIn("sysId: 'SYS.002'", updated)
        self.assertIn('sysId: "SYS.003"', updated)
        self.assertIn('featured: true', updated)
        self.assertIn('deployedProjects: 3', updated)
        self.assertIn('With 3+ deployed production units', updated)

    def test_appends_after_an_existing_trailing_comma(self):
        trailing_comma_fixture = PORTFOLIO_FIXTURE.replace(
            "    sysId: 'SYS.002'\n  }\n];",
            "    sysId: 'SYS.002'\n  },\n];",
        )
        with tempfile.TemporaryDirectory() as temporary_directory:
            portfolio_path = Path(temporary_directory) / 'src' / 'data' / 'portfolio.ts'
            portfolio_path.parent.mkdir(parents=True)
            portfolio_path.write_text(trailing_comma_fixture, encoding='utf-8')

            add_project.append_project_to_portfolio(
                portfolio_path,
                self.make_project(),
            )
            updated = portfolio_path.read_text(encoding='utf-8')

        self.assertNotIn('},,', updated)
        self.assertEqual(updated.count('sysId:'), 3)

    def test_parses_only_documented_github_repository_formats(self):
        accepted = (
            'https://github.com/roco007/OceanEdge',
            'https://github.com/roco007/OceanEdge.git/',
            'github.com/roco007/OceanEdge',
            'roco007/OceanEdge',
        )
        for value in accepted:
            with self.subTest(value=value):
                self.assertEqual(
                    add_project.parse_repo_identifier(value),
                    ('roco007', 'OceanEdge'),
                )

        rejected = (
            'https://gitlab.com/roco007/OceanEdge',
            'https://github.com/roco007/OceanEdge/issues',
            'https://github.com/roco007',
            'roco007/OceanEdge/issues',
        )
        for value in rejected:
            with self.subTest(value=value):
                self.assertEqual(add_project.parse_repo_identifier(value), (None, None))

    def test_rejects_duplicate_repository_without_changing_portfolio(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            portfolio_path = Path(temporary_directory) / 'src' / 'data' / 'portfolio.ts'
            portfolio_path.parent.mkdir(parents=True)
            original = PORTFOLIO_FIXTURE.replace(
                'https://github.com/roco007/second-project',
                'https://github.com/roco007/OceanEdge',
            )
            portfolio_path.write_text(original, encoding='utf-8')

            with self.assertRaisesRegex(add_project.PortfolioUpdateError, 'already exists'):
                add_project.append_project_to_portfolio(
                    portfolio_path,
                    self.make_project(),
                )

            self.assertEqual(portfolio_path.read_text(encoding='utf-8'), original)

    def test_rejects_duplicate_project_id_without_changing_portfolio(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            portfolio_path = Path(temporary_directory) / 'src' / 'data' / 'portfolio.ts'
            portfolio_path.parent.mkdir(parents=True)
            original = PORTFOLIO_FIXTURE.replace('first-project', 'ocean-edge')
            portfolio_path.write_text(original, encoding='utf-8')

            with self.assertRaisesRegex(add_project.PortfolioUpdateError, 'project id.*already exists'):
                add_project.append_project_to_portfolio(
                    portfolio_path,
                    self.make_project(),
                )

            self.assertEqual(portfolio_path.read_text(encoding='utf-8'), original)

    def test_requires_portfolio_source_on_current_branch(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            missing_path = Path(temporary_directory) / 'src' / 'data' / 'portfolio.ts'

            with self.assertRaisesRegex(
                add_project.PortfolioUpdateError,
                'does not contain src/data/portfolio.ts',
            ):
                add_project.append_project_to_portfolio(
                    missing_path,
                    self.make_project(),
                )

            self.assertFalse(missing_path.exists())

    def test_process_repo_checks_branch_before_collecting_project_details(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            missing_path = root / 'src' / 'data' / 'portfolio.ts'
            repo_data = {
                'name': 'OceanEdge',
                'description': 'A local-first tide exploration game.',
                'homepage': '',
                'topics': [],
                'language': 'TypeScript',
                'html_url': 'https://github.com/roco007/OceanEdge',
            }

            with self.assertRaisesRegex(
                add_project.PortfolioUpdateError,
                'does not contain src/data/portfolio.ts',
            ):
                add_project.process_repo(
                    'roco007/OceanEdge',
                    portfolio_path=missing_path,
                    images_dir=root / 'public' / 'images',
                    repo_data=repo_data,
                    interactive=False,
                )

    def test_rejects_image_paths_outside_public_images(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            images_dir = Path(temporary_directory) / 'public' / 'images'
            images_dir.mkdir(parents=True)
            (images_dir / 'notes.txt').write_text('not an image', encoding='utf-8')

            invalid_images = ('images//etc/hosts', 'images/notes.txt')
            for invalid_image in invalid_images:
                with self.subTest(invalid_image=invalid_image):
                    with self.assertRaises(add_project.PortfolioUpdateError):
                        add_project.resolve_image_reference(
                            'OceanEdge',
                            invalid_image,
                            images_dir,
                        )

    def test_failed_atomic_replace_preserves_portfolio(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            portfolio_path = Path(temporary_directory) / 'src' / 'data' / 'portfolio.ts'
            portfolio_path.parent.mkdir(parents=True)
            portfolio_path.write_text(PORTFOLIO_FIXTURE, encoding='utf-8')

            with patch('os.replace', side_effect=OSError('replace failed')):
                with self.assertRaisesRegex(
                    add_project.PortfolioUpdateError,
                    'Could not safely update',
                ):
                    add_project.append_project_to_portfolio(
                        portfolio_path,
                        self.make_project(),
                    )

            self.assertEqual(
                portfolio_path.read_text(encoding='utf-8'),
                PORTFOLIO_FIXTURE,
            )
            self.assertEqual(list(portfolio_path.parent.glob('*.tmp')), [])

    def test_rejects_web_urls_without_a_hostname(self):
        with self.assertRaises(add_project.PortfolioUpdateError):
            add_project._validated_web_url('https://?', 'Live demo URL')

    def test_processes_repository_metadata_into_portfolio_ts(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            portfolio_path = root / 'src' / 'data' / 'portfolio.ts'
            images_dir = root / 'public' / 'images'
            portfolio_path.parent.mkdir(parents=True)
            images_dir.mkdir(parents=True)
            portfolio_path.write_text(PORTFOLIO_FIXTURE, encoding='utf-8')
            (images_dir / 'ocean-edge.webp').write_bytes(b'preview')

            repo_data = {
                'name': 'OceanEdge',
                'description': 'A local-first tide exploration game.',
                'homepage': 'https://ocean-edge.example.com',
                'topics': ['phaser', 'browser-game'],
                'language': 'TypeScript',
                'html_url': 'https://github.com/roco007/OceanEdge',
            }

            output = StringIO()
            try:
                with redirect_stdout(output):
                    total = add_project.process_repo(
                        'roco007/OceanEdge',
                        override_category='interactive',
                        override_image='images/ocean-edge.webp',
                        override_problem='Removes setup friction from short exploration games.',
                        override_features='Changing tide routes,Keyboard and touch controls',
                        override_technologies='TypeScript,Phaser 3,Vite',
                        portfolio_path=portfolio_path,
                        images_dir=images_dir,
                        repo_data=repo_data,
                        interactive=False,
                    )
            except TypeError as error:
                self.fail(f'process_repo does not support the portfolio.ts workflow: {error}')

            updated = portfolio_path.read_text(encoding='utf-8')

        self.assertEqual(total, 3)
        self.assertIn('id: "ocean-edge"', updated)
        self.assertIn('title: "Ocean Edge"', updated)
        self.assertIn('description: "A local-first tide exploration game."', updated)
        self.assertIn('problemSolved: "Removes setup friction from short exploration games."', updated)
        self.assertIn('"Changing tide routes"', updated)
        self.assertIn('"Keyboard and touch controls"', updated)
        self.assertIn('"TypeScript"', updated)
        self.assertIn('"Phaser 3"', updated)
        self.assertIn('"Vite"', updated)
        self.assertIn('image: "images/ocean-edge.webp"', updated)
        self.assertNotIn('project-card', updated)

    def test_help_documents_portfolio_fields(self):
        result = subprocess.run(
            [sys.executable, str(Path(add_project.__file__)), '--help'],
            check=False,
            capture_output=True,
            text=True,
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('src/data/portfolio.ts', result.stdout)
        self.assertIn('--problem', result.stdout)
        self.assertIn('--features', result.stdout)
        self.assertIn('--technologies', result.stdout)
        self.assertIn('--no-featured', result.stdout)

    def test_non_interactive_cli_requires_repository_argument(self):
        result = subprocess.run(
            [
                sys.executable,
                str(Path(add_project.__file__)),
                '--non-interactive',
            ],
            check=False,
            capture_output=True,
            input='',
            text=True,
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn('repository', result.stderr.lower())


if __name__ == '__main__':
    unittest.main()
