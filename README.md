# Data Visualization of Titanic Dataset

View the published page at https://williampuk.github.io/project6-data-visualization/
(Note that the published page may be out-of-sync with the master branch, since the publishing is done manually.)

### Summary

This dataset contains the records of the passengers in the Titanic tragedy. In this visualization, the relationship between survival rate and each of the following attributes of the passengers, namely age, sex, and passenger class, are explored. Users will be able to do their own analysis after the narrative.

### Design Choice

I have chosen 4 variables of passenger data to visualize; they are 3 attributes of the passengers and their survival. These 3 passenger attributes are chosen is because these are the most easiest variables to visualize, and their noticeable relationship between the survival of the passengers. It is also due to the problem set of the Udacity course "Intro to Data Science", where a custom heuristic is to be made to predict the survival rate of passengers. My simple heuristic is to use one or more of the sex, age or passenger class data of the passengers to achieve a result of slightly higher than 80% correctness.

The main focus is the survival rate, and thus it is put on the top. A bar chart is used for easy comparison of survived and perished passengers. A percentage bar is shown besides the bar chart to give a quick view of the proportion. Based on the feedback, I have put more emphasis on this section, as to let users know this section is the main focus and it is changed with the interaction of below 3 passenger attributes.

The three variables use a very similar structure to present. A histogram with stacked survival data is used to present the age. A bar chart with stacked survival data is used to present each of the sex and passenger class. This choice of including stacked survival data is based on one of the feedback I have received, where the reader wanted to do a quick comparison between the male and female survival rate. Another feedback I have received is that they did not know these 3 charts are interacting with each other, and together change the survival rate. Therefore, these 3 charts are then made more consistently presented, and sized appropriately.

Only two main colors are used in all charts, one for the survived and one for the perished. There two are picked using the Colorbrewer2.0 (listed in the resources), with reduced opacity of the red color for the comfortable viewing. A consistent color theme was suggested by the submission reviewer. The suggested stacked survival data presentation also allows this to happen.

The whole design is keep as simple as possible. Though feedback was collected asking to add some graphics to make it look better or more interesting, I decided to keep the design simple so that figures and information can be presented accurately, and users can focus on the data without distraction.

The Martini Glass is used in this visualization as the narrative structure. The narrative only visualize the noticeable relationship between each of the passenger attributes and the survival rate. It can serve as the starting point and arouse the interest of the users to think about how survival rate changes with different combinations of the attributes. Users can explore on their own through interacting with the 3 charts. I have tried to balance the information and the length of the narratives, based on the feedback saying the narratives are a bit boring. It is kept as concise as possible.

The design originally lacked the explanatory encodings, with only the interactive elements. The feedback of the Udacity reviewer provides insightful explanations. This visualization now has a story to tell before letting users do their own exploration.

### Feedback

Feedback is received in different time of doing of the project. The approximate commit are listed, and it is very close to but may not be exactly the one the reader gave feedback against, based on some local changes or other reasons.

Here I also included the review of the Udacity project reivewer, since I found them very valuable.

Feedbacks from Udacity project reviewer (based around commit #26462e9 or #c8f3a2c)
- Commented that the visualization lacked explanatory encodings.
- Provided Different types of possible explanatory encodings/ findings
- Proposed using the Martini Glass narrative structures

Feedbacks summarized below are from 2 readers, which were given against around commit #31c93c2 and #9bfd027
- Initially thought that charts are not related to each other
- Did not know the main focus is the survival rate. Did not know what to focus. Too much information
- One of them thought the age chart is the main focus, as it was very large.
- One of them did not notice the narratives also mention about the sex and passenger class (may be distracted by me though)
- One of them did not know what passenger class is
- One of them wanted to compare survival rate directly between sex attributes, which was required some steps to achieve before stacked survival rate was introduced
- Suggested some graphics so that it can look more interesting
- Need axis labeling

Feedbacks from 1 reader, which were given against around commit #139fea0 (much improved version)
- The narratives are a bit boring
- The relationship was noticed by him (with my slight explanation)
- Did not know how to interact with the 3 charts (the helper text was not yet added due to incompleteness)
- Needed a reset button as it is difficult to remove the brush once it is extended to full width

### Resources
Books (including also the D3.js examples accessible through the link provided in the book. (Links are not provided here because I did not seek permission from the author.))
- D3.js By Example (Author: Michael Heydt, ISBN 13: 9781785280085, Packt Publishing)

D3.js Github Wiki
- https://github.com/mbostock/d3/wiki

D3 examples on bl.ocks.org by Mike Bostock
- http://bl.ocks.org/mbostock

Udacity course - Data Visualization with D3.js
- https://www.udacity.com/course/data-visualization-and-d3js--ud507

Udacity course - Intro to Data Science
- https://www.udacity.com/course/intro-to-data-science--ud359

Colorbrewer 2.0
- http://colorbrewer2.org/

Perceptual Edge articles
- https://www.perceptualedge.com/articles/b-eye/encoding_values_in_graph.pdf
- https://www.perceptualedge.com/articles/visual_business_intelligence/save_the_pies_for_dessert.pdf
- https://www.perceptualedge.com/articles/visual_business_intelligence/rules_for_using_color.pdf
- https://www.perceptualedge.com/articles/b-eye/choosing_colors.pdf

Miscellaneous tutorial/forum pages
  - Stack Overflow
  > http://stackoverflow.com/questions/14958825/dynamically-update-chart-data-in-d3

  - Mozilla Developer Network (https://developer.mozilla.org)

  - w3schools.com (http://www.w3schools.com/)

The dataset

- Dataset source and Description
> https://www.kaggle.com/c/titanic/data

Tools / Libraries

- D3.js
- Bootstrap CSS
- jQuery
- Babel polyfill
- Jade template engine
- node.js

For code beautifying and formatting

- Atom Editor
- Visual Studio Code
