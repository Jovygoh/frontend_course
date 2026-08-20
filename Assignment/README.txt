AI & Innovation Club - Multi-page Version
==========================================

Files:
- index.html
- ai-knowledge.html
- MLprojects.html
- resources.html
- workshops.html
- workshop-detail.html
- challenges.html
- challenge-detail.html
- styles.css
- script.js

Mobile responsiveness:
1. Every HTML page contains:
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
2. Bootstrap responsive grid classes are preserved.
3. The navbar collapses into a hamburger menu on small screens.
4. Extra mobile CSS is included in styles.css.
5. Do NOT create a separate "mobile.html". The same pages adapt to screen size.

To test on desktop:
- Open Chrome/Edge DevTools
- Toggle device toolbar
- Test widths such as 320px, 375px, 390px, 768px, and desktop width.

To open on a real phone:
- Deploy the whole folder to a static web host and open the HTTPS URL on the phone.
- Keep all eight HTML files, styles.css and script.js in the same folder unless you update paths.
- Do not send only index.html; the other pages and shared files are required.

Important:
- The filename MLprojects.html is case-sensitive on many web servers.
  Keep the same capitalization everywhere, or rename it consistently to ml-projects.html.


Latest ML/Resources updates:
- ML Projects now feature real public GitHub projects: Ultralytics YOLO, Rasa, and Darts.
- Project modal opens the corresponding public GitHub repository.
- Pitch form includes an optional GitHub / Project URL field.
- Resource View buttons open the actual resource in a new tab while Session Storage counts the click.


Final ML Projects & Resources adjustments
----------------------------------------
- Original ML project card names and overall visual design are preserved.
- Each project's detail modal links to a real public GitHub repository as an open-source technical reference.
- The button is labelled "View Reference GitHub" so the repository is not presented as the club's own code.
- Pitch a New ML Project includes an optional GitHub / Project URL; an idea can still be submitted without a link.
- Resource View buttons open the actual learning resource in a new tab and increment the Session Storage counter.


Latest final adjustment
-----------------------
- Workshop registration popup restored: after a valid registration is saved to Local Storage,
  the browser displays "Successfully registered for: <selected workshop>" as in the original design.


INLINE-JAVASCRIPT FINAL VERSION
===============================
All JavaScript is embedded directly inside each HTML file.
There is no external script.js dependency in this package.

Keep styles.css in the same folder as all HTML files.
External libraries such as jQuery and Bootstrap still load from CDN.

Recommended test:
python -m http.server 8000
Then open:
http://localhost:8000/index.html

Use Ctrl+F5 after replacing older files.
