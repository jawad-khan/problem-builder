# -*- coding: utf-8 -*-


# Imports ###########################################################

import logging

from xblock.core import XBlock
from xblock.fields import List, Scope, String
from xblock.fragment import Fragment

from .utils import load_resource, render_template


# Globals ###########################################################

log = logging.getLogger(__name__)


# Functions #########################################################

def commas_to_list(commas_str):
    """
    Converts a comma-separated string to a list
    """
    if commas_str is None:
        return None
    elif commas_str == '':
        return []
    else:
        return commas_str.split(',')


# Classes ###########################################################

class QuizzBlock(XBlock):
    """
    TODO: Description
    """
    question = String(help="Question to ask the student", scope=Scope.content, default="")
    type = String(help="Type of quizz", scope=Scope.content, default="yes-no-unsure")
    low = String(help="Label for low ratings", scope=Scope.content, default="Less")
    high = String(help="Label for high ratings", scope=Scope.content, default="More")
    tip = String(help="Mentoring tip to provide if needed", scope=Scope.content, default="")
    tip_display = List(help="List of choices to display the tip for", scope=Scope.content, default=None)
    reject = List(help="List of choices to reject", scope=Scope.content, default=None)
    student_choice = String(help="Last input submitted by the student", default="", scope=Scope.user_state)

    @classmethod
    def parse_xml(cls, node, runtime, keys):
        block = runtime.construct_xblock_from_class(cls, keys)

        for child in node:
            if child.tag == "question":
                block.question = child.text
            elif child.tag == "tip":
                block.tip = child.text
                block.reject = commas_to_list(child.get('reject'))
                block.display = commas_to_list(child.get('display'))
            else:
                block.runtime.add_node_as_child(block, child)

        for name, value in node.items():
            if name in block.fields:
                setattr(block, name, value)

        return block

    def student_view(self, context=None):  # pylint: disable=W0613
        """Returns default student view."""
        return Fragment(u"<p>I can only appear inside mentoring blocks.</p>")

    def mentoring_view(self, context=None):
        if self.type not in ('yes-no-unsure', 'rating'):
            raise ValueError, u'Invalid value for QuizzBlock.type: `{}`'.format(self.type)

        template_path = 'static/html/quizz_{}.html'.format(self.type)
        html = render_template(template_path, {
            'self': self,
        })

        fragment = Fragment(html)
        fragment.add_css(load_resource('static/css/quizz.css'))
        fragment.add_javascript(load_resource('static/js/quizz.js'))
        fragment.initialize_js('QuizzBlock')
        return fragment

    def submit(self, submission):
        log.info(u'Received quizz submission: %s', submission)

        # TODO
        completed = bool(submission)
        show_tip = completed

        if show_tip:
            formatted_tip = render_template('static/html/tip.html', {
                'self': self,
            })
        else:
            formatted_tip = ''

        return {
            'submission': submission,
            'completed': completed,
            'tip': formatted_tip,
        }

        #self.student_input = submission[0]['value']
        #log.info(u'Answer submitted for`{}`: "{}"'.format(self.name, self.student_input))
        #return self.student_choice

