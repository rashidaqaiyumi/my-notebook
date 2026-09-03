CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories are open" ON public.categories FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  is_pinned boolean NOT NULL DEFAULT false,
  is_favorite boolean NOT NULL DEFAULT false,
  has_important_links boolean NOT NULL DEFAULT false,
  opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO anon, authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes are open" ON public.notes FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER notes_touch_updated_at BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.categories (name) VALUES ('Study'),('Work'),('Personal'),('Ideas'),('Projects'),('Resources');

INSERT INTO public.notes (title, content, category, tags, is_pinned, is_favorite, has_important_links) VALUES
('Python Study Plan',
'<h2>Python Study Plan</h2><h3>Week 1 — Foundations</h3><ul><li>Learn variables and data types</li><li>Learn functions and modules</li><li>Get comfortable with <mark data-color="yellow" style="background-color: var(--hl-yellow)">list comprehensions</mark></li></ul><h3>Week 2 — Data</h3><ol><li>Learn pandas basics</li><li>Practice with a real CSV dataset</li><li>Build a small data analysis project</li></ol><h3>Tasks</h3><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Install Python + set up the editor</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Complete the first 20 exercises</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Build the mini project</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Practice SQL joins for an hour</p></div></li></ul><blockquote><p>Little and often beats one long panicked evening.</p></blockquote>',
'Study', ARRAY['python','learning'], true, true, false),
('Useful SQL Resources',
'<h2>Useful SQL Resources</h2><p>Places I keep coming back to when I forget how window functions work.</p><ul><li><a href="https://www.postgresql.org/docs/current/tutorial.html">PostgreSQL official tutorial</a></li><li><a href="https://sqlbolt.com">SQLBolt — interactive lessons</a></li><li><a href="https://use-the-index-luke.com">Use The Index, Luke — indexing</a></li></ul><p><strong>Remember:</strong> <mark data-color="green" style="background-color: var(--hl-green)">GROUP BY collapses rows, window functions keep them.</mark></p><pre><code>SELECT name, AVG(score) OVER (PARTITION BY class) FROM students;</code></pre>',
'Resources', ARRAY['sql','links'], false, false, true),
('Project Ideas',
'<h2>Project Ideas</h2><h3>Small &amp; finishable</h3><ul><li>A reading tracker with a weekly page goal</li><li>A tiny CLI that summarises my notes</li><li><mark data-color="blue" style="background-color: var(--hl-blue)">A personal dashboard for habits</mark></li></ul><h3>Bigger, later</h3><ol><li>Data analysis of my own music listening history</li><li>A study-spaced-repetition tool</li></ol><hr><p><em>Pick one. Finish it. Then pick the next.</em></p>',
'Ideas', ARRAY['ideas'], true, false, false),
('Things To Remember',
'<h2>Things To Remember</h2><ul><li>Water the plants on <strong>Sunday</strong></li><li>Passport expires next spring</li><li><mark data-color="pink" style="background-color: var(--hl-pink)">Call home on weekends</mark></li></ul><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Update the resume</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Back up the photo library</p></div></li></ul><blockquote><p>A calm mind is a stored mind.</p></blockquote>',
'Personal', ARRAY['life'], false, true, false);